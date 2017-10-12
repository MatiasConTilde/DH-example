const io = require('socket.io')(require('express')().listen(process.env.PORT || 3000));

// From https://en.wikipedia.org/wiki/Primality_test#Pseudocode
const isPrime = n => {
  if (n <= 1) return false;
  else if (n <= 3) return true;
  else if (n % 2 === 0 || n % 3 === 0) return false;

  let i = 5;
  while (i * i <= n) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
    i += 6;
  }
  return true;
};

// From https://en.wikipedia.org/wiki/Euclidean_algorithm#Implementations adapted to ES6 arrow function
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);

// Made by myself with the descriptions and examples of https://en.wikipedia.org/wiki/Primitive_root_modulo_n
const prm = (g, n) => {
  let coprimes = [];
  for (let i = 0; i < n; i++) {
    if (gcd(i, n) === 1) coprimes.push(i);
  }

  for (let i = 1; i < n; i++) {
    const aInd = coprimes.indexOf(Math.pow(g, i) % n);
    if (aInd === -1) break;
    coprimes.splice(aInd, 1);
  }

  return coprimes.length === 0;
};

io.sockets.on('connection', socket => {
  socket.emit('order', {
    order: io.engine.clientsCount
  });

  // Kick new client if there are too many
  if (io.engine.clientsCount > 2) socket.disconnect();

  socket.on('requestPG', data => {
    // Select max p value based on parameters
    const max = data.easy ? 100 : data.prm ? 1000 : Math.pow(2, 24);

    let p = 0, g = 0;

    // Select random prime p < max
    while (!isPrime(p)) p = Math.floor(Math.random() * max);


    if (data.prm) {
      for (let i = p - 1; i > 0; i--) {
        // Select biggest primitive root modulo p
        if (prm(p, i)) {
          g = i;
          break;
        }
      }
    } else {
      // Select random g < p
      g = Math.floor(Math.random() * p);
    }

    // Send back results to all clients
    socket.emit('pg', { p, g });
    socket.broadcast.emit('pg', { p, g });
  });

  socket.on('sendUpper', data => {
    // Send upper (A or B) to the other client
    socket.broadcast.emit('recieveUpper', data);
  });
});
