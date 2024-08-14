#!/bin/bash

# Controlla se è stato passato un argomento (nome utente)
if [ -z "$1" ]; then
  echo "Errore: specificare un nome utente."
  exit 1
fi

username="$1"

# Copia i file nelle rispettive directory sul server remoto
scp -r node_modules/ "$username"@eva.cs.unibo.it:/home/web/site232407/html/selfie/
scp -r client/node_modules/ "$username"@eva.cs.unibo.it:/home/web/site232407/html/selfie/client/
scp -r client/build/ "$username"@eva.cs.unibo.it:/home/web/site232407/html/selfie/client/

echo "Procedure completed successfully"

