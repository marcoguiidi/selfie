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

        // Trova eventi creati dall'utente o a cui è stato invitato
        const events = await Event.find({
            $or: [
                { createdBy: req.user.id },
                { invited: { $in: [userEmail] } }
            ]
        }).populate('createdBy', 'email');

        res.json(events);
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
      if (event.isDeadline && event.end < now) {
        event.status = 'expired';
      } else {
        event.status = 'active';
      }
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

  console.log('qui ci arriva?', event);
  
  // Definisci la data finale
  const endDate = new Date(endRepetition);
  let nextStart = new Date(start);
  let nextEnd = new Date(end);

  // Gestisci le ripetizioni
  while (nextStart < endDate) {

      console.log('nextStart:', nextStart);
      console.log('endDate:', endDate);
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
              const month = nextStart.getMonth();
              nextStart.setMonth(month + 1);
              nextEnd.setMonth(month + 1);
              if (nextStart.getDate() < start.getDate()) {
                  nextStart.setDate(0); // Imposta all'ultimo giorno del mese
                  nextEnd.setDate(0); // Imposta all'ultimo giorno del mese
              }
              break;
          case 'yearly':
              nextStart.setFullYear(nextStart.getFullYear() + 1);
              nextEnd.setFullYear(nextEnd.getFullYear() + 1);
              break;
          default:
              break;
      }

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

  try {
      // Salva tutte le ripetizioni nel database
      await Event.insertMany(repetitions);
  } catch (error) {
      console.error('Errore durante il salvataggio delle ripetizioni:', error);
  }
};

module.exports = router;
