npm install && \
cd client && \
rm -rf build/ && \
npm install && \
npm run build && \
cd .. && \
nodemon server.js
