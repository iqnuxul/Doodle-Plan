
import React, { useRef, useState, useEffect } from 'react';
import { X, Wand2, Eraser } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface SketchPadProps {
  onClose: () => void;
  onSave: (imageUrl: string) => void;
}

const SketchPad: React.FC<SketchPadProps> = ({ onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.lineWidth = 3;
        context.strokeStyle = '#44403c'; // Pencil lead color
        setCtx(context);
        
        // Fill white background for better AI processing
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (ctx) ctx.closePath();
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleClear = () => {
    if (ctx && canvasRef.current) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleMagicify = async () => {
    if (!process.env.API_KEY) {
      alert("API Key missing! Cannot use Magicify.");
      return;
    }
    if (!canvasRef.current) return;

    setIsGenerating(true);
    try {
      const base64Data = canvasRef.current.toDataURL('image/png').split(',')[1];
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-2.5-flash-image';
      
      const prompt = `
        Transform this sketch into a cute, hand-drawn sticker style illustration. 
        Style description:
        - Use pencil-like, slightly rough dark brown outlines (like graphite).
        - Use flat, soft pastel colors (cream, soft blue, pale pink, muted yellow).
        - The style should be whimsical and simple, like a cute children's book illustration or a cafe sticker.
        - Keep the character/object cute and chubby if possible.
        - White background.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: base64Data } },
                { text: prompt }
            ]
        }
      });

      let generatedImage = null;
      const parts = response.candidates?.[0]?.content?.parts;
      
      if (parts) {
          for (const part of parts) {
              if (part.inlineData) {
                  generatedImage = `data:image/png;base64,${part.inlineData.data}`;
                  break;
              }
          }
      }

      if (!generatedImage) {
          generatedImage = canvasRef.current.toDataURL('image/png');
      }

      onSave(generatedImage);
      onClose();

    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("Oops! The magic wand fizzled out. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="soft-card p-6 w-full max-w-md flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-stone-700 letterpress-title">Doodle Something!</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border border-stone-200 rounded-xl overflow-hidden bg-white touch-none shadow-inner">
          <canvas
            ref={canvasRef}
            width={350}
            height={350}
            className="w-full h-auto cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex justify-between items-center gap-3 pt-2">
            <button 
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-3 border border-stone-200 rounded-xl hover:bg-red-50 hover:border-red-200 text-stone-500 hover:text-red-500 font-bold transition-all text-xs uppercase tracking-wider"
            >
                <Eraser size={16} /> Clear
            </button>
            <button 
                onClick={handleMagicify}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100/50 border border-yellow-200 rounded-xl hover:bg-yellow-200/50 hover:shadow-md font-bold transition-all disabled:opacity-50 text-stone-700 text-xs uppercase tracking-wider"
            >
                {isGenerating ? 'Magic happening...' : <><Wand2 size={16} /> Make Sticker</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SketchPad;
