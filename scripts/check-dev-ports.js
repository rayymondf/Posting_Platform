require('dotenv').config();
const net = require('net');

const ports = [
  { name: 'Express API', port: Number(process.env.PORT || 3000) },
  { name: 'Vite client', port: Number(process.env.VITE_PORT || 5173) }
];

async function canUsePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

async function main() {
  const blocked = [];

  for (const item of ports) {
    const available = await canUsePort(item.port);
    if (!available) blocked.push(item);
  }

  if (!blocked.length) return;

  console.error('\nCannot start Instigator because a dev port is already in use.\n');
  for (const item of blocked) {
    console.error(`- ${item.name} port ${item.port} is busy.`);
  }
  console.error('\nWindows PowerShell fix:');
  console.error('  netstat -ano | findstr :<PORT>');
  console.error('  taskkill /PID <PID_NUMBER> /F\n');
  console.error('Then run npm run dev again.\n');
  process.exit(1);
}

main();
