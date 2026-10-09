const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/B75229BDA87B25A9A18C7939C6FF3783');

ws.on('open', () => {
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        const input = document.querySelector('input[type=date]');
        const rows = Array.from(document.querySelectorAll('.results-table-row')).map(r => r.innerText.trim());
        const pillText = document.querySelector('div[style*="min-height: 45px"], div[style*="minHeight: 45px"]')?.innerText || '';
        return {
          inputValue: input ? input.value : null,
          max: input ? input.max : null,
          rowCount: rows.length,
          pillText,
          rows: rows.slice(0, 5)
        };
      })()`,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  console.log(JSON.stringify(JSON.parse(msg.toString()), null, 2));
  process.exit(0);
});
