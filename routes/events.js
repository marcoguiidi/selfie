const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const authenticateJWT = require('../middleware/authenticateJWT');

// Ottieni gli eventi creati dall'utente o a cui è invitato
router.get('/', authenticateJWT, async (req, res) => {
  try {
      const userEmail = req.user.email;
      const now = req.query.currentDate ? new Date(req.query.currentDate) : new Date(); // Usa la data passata o la data attuale

      // Trova eventi creati dall'utente o a cui è stato invitato
      let events = await Event.find({
          $or: [
              { createdBy: req.user.id },
              { invited: { $in: [userEmail] } }
          ]
      }).populate('createdBy', 'email');


      const updatedEvents = await Promise.all(events.map(async (event) => {
          if (!event.title.startsWith('Pomodoro Session') && event.color !== '#FF6347' && event.isDeadline) {
            if (event.end < now){
              const endDate = new Date(event.end);
              if (event.status == 'expired' || event.status == 'active'){
                event.status = 'expired';
                if (endDate.getDate() < now.getDate()){
                  endDate.setDate(now.getDate());
                  event.start = endDate;
                  event.end = endDate;
                }
              }
            } else if (event.status !== 'active' && event.status !== 'completed'){
              event.status = 'active';
            }
            await event.save();
          }
          return event;
      }));

      res.json(updatedEvents);
  } catch (err) {
      console.error('Server Error:', err);
      res.status(500).json({ message: 'Server error' });
  }
});

router.get('/lastPomodoro', authenticateJWT, async (req, res) => {
  try {
    // Trova l'evento che inizia con "pomodoro Session" e ha il colore '#FF6347'
    const pomodoro = await Event.findOne({
      title: { $regex: '^Pomodoro Session', $options: 'i' }, // Usa regex per cercare all'inizio
      color: '#FF6347',
      createdBy: req.user.id, 
    })
      .sort({ end: -1 }) // Ordina per endDate in ordine decrescente
      .exec(); // Esegui la query

    // Se non viene trovato nessun pomodoro, restituisci un messaggio appropriato
    if (!pomodoro) {
      return res.status(404).json({ message: 'Nessun pomodoro trovato' });
    }

    // Restituisci l'evento trovato
    res.status(200).json(pomodoro);
  } catch (err) {
    console.error('Error fetching last pomodoro:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




// Ottieni un singolo evento per ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
      const event = await Event.findById(req.params.id)
          .populate('createdBy', 'email'); // Popola i dettagli del creatore se necessario
      
      if (!event) {
          return res.status(404).json({ message: 'Event not found' });
      }

      res.json(event);
  } catch (err) {
      console.error('Server Error:', err);
      res.status(500).json({ message: 'Server error' });
  }
});

// Crea un nuovo evento
router.post('/', authenticateJWT, async (req, res) => {
    const { title, start, end, isDeadline, description, invited, color, repetition, endRepetition } = req.body;
    try {
      const newEvent = new Event({
        title: title,
        start: start,
        end: end,
        isDeadline: isDeadline,
        description: description,
        createdBy: req.user.id,
        invited: invited,
        color: color,
        repetition: repetition,
        endRepetition: endRepetition,
        status: 'active'
      });

      // Salva l'evento principale
      const savedEvent = await newEvent.save();

      // Se c'è una ripetizione, gestisci la creazione degli eventi ripetuti
      if (repetition !== 'no-repetition') {
        await handleRepetedEvents(savedEvent);
      }

      console.log('events.js saving', savedEvent);
      res.status(201).json(savedEvent);
    } catch (err) {
      console.error('Error creating event:', err);
      res.status(500).json({ message: 'Server error' });
    }
});

// Modifica un evento esistente
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
      const { title, start, end, isDeadline, description, invited, color, repetition, endRepetition } = req.body;
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      event.title = title;
      event.start = start;
      event.end = end;
      event.isDeadline = isDeadline;
      event.description = description;
      event.invited = invited;
      event.color = color;
      const now = new Date();
      if(repetition !== 'no-repetition' || repetition !== event.repetition || endRepetition !== event.endRepetition) {
        event.repetition = repetition;
        event.endRepetition = endRepetition;
        const editedEvent = await event.save();
        await Event.deleteMany({ parentEvent: event._id });
        await handleRepetedEvents(editedEvent);
      } else {
        event.repetition = repetition;
        event.endRepetition = endRepetition;
        await event.save();
      }

      res.json(event);
    } catch (err) {
      console.error('Update Status Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
});

// Elimina un evento e tutte le ripetizioni legate
router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (event.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Event.deleteMany({ parentEvent: event._id });
        await Event.deleteOne({ _id: event._id });

        res.json({ message: 'Event and all its repetitions deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:eventId/complete', authenticateJWT, async (req, res) => {
  try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Verifica se l'utente è il creatore dell'evento
        if (event.createdBy.toString()!== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if(!event.isDeadline){
          return res.status(400).json({ message: 'Event is not a deadline' });
        }

        event.status = 'completed';
        await event.save();

        res.json({ message: 'Event completed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }  
});

// Declina un invito a un evento
router.post('/:eventId/decline', authenticateJWT, async (req, res) => {
    try {
        const { eventId } = req.params;

        // Trova l'evento per ID
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Verifica se l'utente è invitato
        if (!event.invited.includes(req.user.email)) {
            return res.status(400).json({ message: 'User not invited to this event' });
        }

        // Rimuovi l'utente dalla lista degli invitati
        event.invited = event.invited.filter(inviteId => inviteId.toString() !== req.user.email);
        
        await event.save();

        res.json({ message: 'Invitation declined successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Gestisci le ripetizioni degli eventi
const handleRepetedEvents = async (event) => {
  const { repetition, endRepetition, start, end } = event;
  const repetitions = [];


  
  // Definisci la data finale
  const endDate = new Date(endRepetition);
  let nextStart = new Date(start);
  let nextEnd = new Date(end);
  const originalDay = nextStart.getDate();

  // Gestisci le ripetizioni
  while (nextStart < endDate) {
      // Incrementa la data in base alla ripetizione
      switch (repetition) {
          case 'daily':
              nextStart.setDate(nextStart.getDate() + 1);
              nextEnd.setDate(nextEnd.getDate() + 1);
              break;
          case 'weekly':
              nextStart.setDate(nextStart.getDate() + 7);
              nextEnd.setDate(nextEnd.getDate() + 7);
              break;
          case 'monthly':
              const currentMonth = nextStart.getMonth();
              const daysInMonth = getDaysInMonth(currentMonth + 1, nextStart.getFullYear());
        
              if(daysInMonth < originalDay){
                // Se il mese successivo non ha abbastanza giorni, imposta l'ultimo giorno del mese
                  nextStart.setDate(daysInMonth);
                  nextEnd.setDate(daysInMonth);
                  nextStart.setMonth(currentMonth + 1);
                  nextEnd.setMonth(currentMonth + 1);
              } else {
                nextStart.setMonth(currentMonth + 1);
                nextEnd.setMonth(currentMonth + 1);
                nextStart.setDate(originalDay);
                nextEnd.setDate(originalDay);
              }
              break;
          case 'yearly':
              nextStart.setFullYear(nextStart.getFullYear() + 1);
              nextEnd.setFullYear(nextEnd.getFullYear() + 1);
              break;
          default:
              break;
      }

      if(nextStart <= endDate){
        // Crea un nuovo evento per ogni ripetizione
        const newEvent = new Event({
          title: event.title,
          start: new Date(nextStart),
          end: new Date(nextEnd),
          isDeadline: event.isDeadline,
          description: event.description,
          createdBy: event.createdBy,
          invited: event.invited,
          color: event.color,
          repetition: repetition,
          endRepetition: endRepetition,
          status: 'active',
          parentEvent: event._id // Collegamento all'evento originale
        });

        repetitions.push(newEvent);
      }
  }

  try {
      // Salva tutte le ripetizioni nel database
      await Event.insertMany(repetitions);
  } catch (error) {
      console.error('Errore durante il salvataggio delle ripetizioni:', error);
  }
};

const getDaysInMonth = (month, year) => { 
  
  return new Date(year, month + 1, 0).getDate();
};

module.exports = router;
