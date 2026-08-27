/**
 * Generates rich, realistic SVG-to-JPEG canvas Data URLs for one-click testing
 */
export async function createSampleImage(
  title: string,
  subtitle: string,
  bgGradient: [string, string],
  iconType: 'truck' | 'coffee' | 'dog' | 'mountain' | 'code',
  filename: string
): Promise<{ file: File; dataUrl: string; name: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, bgGradient[0]);
  grad.addColorStop(1, bgGradient[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);

  // Geometric shapes & decorative background elements
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(700, 100, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(100, 500, 180, 0, Math.PI * 2);
  ctx.fill();

  // Draw subject illustrations based on iconType
  if (iconType === 'truck') {
    // Tow truck scene
    ctx.fillStyle = '#f59e0b';
    ctx.roundRect ? ctx.roundRect(160, 320, 260, 110, 16) : ctx.fillRect(160, 320, 260, 110);
    ctx.fill();

    // Truck cab
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(340, 320);
    ctx.lineTo(420, 320);
    ctx.lineTo(420, 430);
    ctx.lineTo(340, 430);
    ctx.fill();

    // Boom arm
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(190, 320);
    ctx.lineTo(120, 240);
    ctx.lineTo(500, 360);
    ctx.stroke();

    // Towed car
    ctx.fillStyle = '#3b82f6';
    ctx.roundRect ? ctx.roundRect(460, 350, 220, 80, 12) : ctx.fillRect(460, 350, 220, 80);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1e293b';
    const wheels = [200, 380, 500, 640];
    wheels.forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, 430, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(x, 430, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
    });
  } else if (iconType === 'coffee') {
    // Coffee cup on wooden table
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 420, 800, 180);

    // Cup
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(320, 260, 160, 160, [10, 10, 50, 50]) : ctx.fillRect(320, 260, 160, 160);
    ctx.fill();

    // Handle
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(480, 330, 40, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Steam
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(370, 230);
    ctx.bezierCurveTo(360, 190, 390, 160, 380, 120);
    ctx.moveTo(430, 230);
    ctx.bezierCurveTo(420, 190, 450, 160, 440, 120);
    ctx.stroke();
  } else if (iconType === 'dog') {
    // Golden retriever in grass
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 400, 800, 200);

    // Dog body
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(400, 340, 140, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dog head
    ctx.beginPath();
    ctx.arc(280, 270, 60, 0, Math.PI * 2);
    ctx.fill();

    // Snout & Ear
    ctx.beginPath();
    ctx.arc(230, 280, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(310, 280, 25, 45, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Tennis ball
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(170, 420, 25, 0, Math.PI * 2);
    ctx.fill();
  } else if (iconType === 'mountain') {
    // Mountain landscape with sunset
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(400, 320, 90, 0, Math.PI * 2);
    ctx.fill();

    // Mountain peaks
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(100, 600);
    ctx.lineTo(340, 220);
    ctx.lineTo(580, 600);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(350, 600);
    ctx.lineTo(550, 180);
    ctx.lineTo(780, 600);
    ctx.fill();

    // Snow caps
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(340, 220);
    ctx.lineTo(310, 270);
    ctx.lineTo(340, 260);
    ctx.lineTo(370, 270);
    ctx.fill();
  }

  // Header Title and Subtitle Overlay
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(title, 50, 80);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '20px sans-serif';
  ctx.fillText(subtitle, 50, 120);

  // Convert to JPEG Data URL
  const isPng = filename.endsWith('.png');
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, 0.92);

  // Convert to File
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeType });
  const file = new File([blob], filename, { type: mimeType, lastModified: Date.now() });

  return {
    file,
    dataUrl,
    name: filename,
  };
}

export async function getPresetSampleImages(): Promise<Array<{ file: File; dataUrl: string; name: string }>> {
  const sample1 = await createSampleImage(
    'Heavy Towing Incident',
    'Emergency roadside assistance vehicle on freeway',
    ['#1e1b4b', '#312e81'],
    'truck',
    'roadside_tow_truck.jpg'
  );

  const sample2 = await createSampleImage(
    'Artisan Morning Roast',
    'Steaming espresso cup on rustic oak counter',
    ['#451a03', '#78350f'],
    'coffee',
    'morning_coffee_mug.jpg'
  );

  const sample3 = await createSampleImage(
    'Playful Golden Pup',
    'Energetic retriever with bright tennis ball in yard',
    ['#064e3b', '#047857'],
    'dog',
    'golden_retriever_playing.png'
  );

  return [sample1, sample2, sample3];
}
