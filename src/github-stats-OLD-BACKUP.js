 const can = canvas.createCanvas(totalWidth, totalHeight);
 const ctx = can.getContext('2d');

 // Window header
 const radius = 10;
 const topHeight = (2 * titlePadding) + avatarSize;
 ctx.fillStyle = '#A0A0A0';
 ctx.beginPath();
 ctx.moveTo(radius, 0);
 ctx.arcTo(totalWidth, 0, totalWidth, topHeight, Math.min(radius, topHeight));
 ctx.lineTo(totalWidth, topHeight);
 ctx.lineTo(0, topHeight);
 ctx.arcTo(0, 0, radius, 0, Math.min(radius, topHeight));
 ctx.closePath();
 ctx.fill();
 
 // Window body
 ctx.fillStyle = '#C0C0C0';
 ctx.beginPath();
 ctx.moveTo(0, topHeight);
 ctx.lineTo(totalWidth, topHeight);
 ctx.lineTo(totalWidth, totalHeight - radius);
 ctx.arcTo(totalWidth, totalHeight, totalWidth - radius, totalHeight, radius);
 ctx.lineTo(radius, totalHeight);
 ctx.arcTo(0, totalHeight, 0, totalHeight - radius, radius);
 ctx.lineTo(0, topHeight);
 ctx.closePath();
 ctx.fill();

 res.type('png');
 can.createPNGStream().pipe(res);
 