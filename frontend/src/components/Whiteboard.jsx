// components/Whiteboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Pencil, 
  Circle, 
  Square, 
  Type, 
  Image as ImageIcon, 
  Eraser, 
  Save, 
  RotateCcw, 
  RotateCw,
  Trash,
  Maximize,
  Minimize,
  ColorPicker
} from 'lucide-react';

const Whiteboard = ({ roomId }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;
    
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    contextRef.current = context;
    
    // Add window resize listener
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Update context when color or line width changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);
  
  // Redraw canvas with all elements
  useEffect(() => {
    if (contextRef.current) {
      const context = contextRef.current;
      context.clearRect(0, 0, canvasRef.current.width / 2, canvasRef.current.height / 2);
      
      elements.forEach(element => {
        switch (element.type) {
          case 'pencil':
            drawPencilElement(element);
            break;
          case 'rect':
            drawRectElement(element);
            break;
          case 'circle':
            drawCircleElement(element);
            break;
          case 'text':
            drawTextElement(element);
            break;
          default:
            break;
        }
      });
    }
  }, [elements]);
  
  const handleResize = () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    
    // Save current canvas state
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempContext.drawImage(canvas, 0, 0);
    
    // Resize canvas
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;
    
    // Restore context properties
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    contextRef.current = context;
    
    // Restore canvas state
    context.drawImage(tempCanvas, 0, 0);
  };
  
  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    
    switch (tool) {
      case 'pencil':
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
        setElements(prevElements => [
          ...prevElements,
          {
            type: 'pencil',
            id: Date.now(),
            points: [{ x: offsetX, y: offsetY }],
            color: color,
            width: lineWidth
          }
        ]);
        break;
      case 'rect':
      case 'circle':
        setIsDrawing(true);
        setElements(prevElements => [
          ...prevElements,
          {
            type: tool,
            id: Date.now(),
            x1: offsetX,
            y1: offsetY,
            x2: offsetX,
            y2: offsetY,
            color: color,
            width: lineWidth
          }
        ]);
        break;
      case 'text':
        const input = prompt('Enter text:');
        if (input) {
          setElements(prevElements => [
            ...prevElements,
            {
              type: 'text',
              id: Date.now(),
              x: offsetX,
              y: offsetY,
              text: input,
              color: color,
              fontSize: lineWidth * 5
            }
          ]);
        }
        break;
      case 'eraser':
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        contextRef.current.strokeStyle = '#FFFFFF';
        setIsDrawing(true);
        break;
      default:
        break;
    }
  };
  
  const draw = (e) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    
    switch (tool) {
      case 'pencil':
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
        
        setElements(prevElements => {
          const lastElement = prevElements[prevElements.length - 1];
          const updatedElement = {
            ...lastElement,
            points: [...lastElement.points, { x: offsetX, y: offsetY }]
          };
          return [...prevElements.slice(0, -1), updatedElement];
        });
        break;
      case 'rect':
      case 'circle':
        setElements(prevElements => {
          const lastElement = prevElements[prevElements.length - 1];
          const updatedElement = {
            ...lastElement,
            x2: offsetX,
            y2: offsetY
          };
          return [...prevElements.slice(0, -1), updatedElement];
        });
        break;
      case 'eraser':
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
        break;
      default:
        break;
    }
  };
  
  const finishDrawing = () => {
    if (!isDrawing) return;
    
    contextRef.current.closePath();
    setIsDrawing(false);
    
    if (tool === 'eraser') {
      contextRef.current.strokeStyle = color;
    } else {
      // Save to history for undo
      setHistory([]);
    }
  };
  
  const drawPencilElement = (element) => {
    const context = contextRef.current;
    context.beginPath();
    context.strokeStyle = element.color;
    context.lineWidth = element.width;
    
    element.points.forEach((point, i) => {
      if (i === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    
    context.stroke();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
  };
  
  const drawRectElement = (element) => {
    const context = contextRef.current;
    context.beginPath();
    context.strokeStyle = element.color;
    context.lineWidth = element.width;
    
    const width = element.x2 - element.x1;
    const height = element.y2 - element.y1;
    
    context.strokeRect(element.x1, element.y1, width, height);
    
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
  };
  
  const drawCircleElement = (element) => {
    const context = contextRef.current;
    context.beginPath();
    context.strokeStyle = element.color;
    context.lineWidth = element.width;
    
    const radius = Math.sqrt(
      Math.pow(element.x2 - element.x1, 2) + Math.pow(element.y2 - element.y1, 2)
    );
    
    context.arc(element.x1, element.y1, radius, 0, 2 * Math.PI);
    context.stroke();
    
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
  };
  
  const drawTextElement = (element) => {
    const context = contextRef.current;
    context.font = `${element.fontSize}px Arial`;
    context.fillStyle = element.color;
    context.fillText(element.text, element.x, element.y);
    context.fillStyle = color;
  };
  
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    // Check if it's a touch event
    if (e.touches && e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    }
    return { offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY };
  };
  
  const handleClear = () => {
    // Save current state to history for undo
    setHistory(prevHistory => [...prevHistory, [...elements]]);
    
    // Clear canvas
    contextRef.current.clearRect(0, 0, canvasRef.current.width / 2, canvasRef.current.height / 2);
    setElements([]);
  };
  
  const handleUndo = () => {
    if (elements.length === 0) return;
    
    // Save current state for redo
    setHistory(prevHistory => [...prevHistory, [...elements]]);
    
    // Remove the last element
    setElements(prevElements => prevElements.slice(0, -1));
  };
  
  const handleRedo = () => {
    if (history.length === 0) return;
    
    // Get the last state from history
    const lastState = history[history.length - 1];
    
    // Apply that state
    setElements(lastState);
    
    // Remove that state from history
    setHistory(prevHistory => prevHistory.slice(0, -1));
  };
  
  const handleSave = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');
    
    // Create a link element and trigger a download
    const link = document.createElement('a');
    link.href = image;
    link.download = `whiteboard-${Date.now()}.png`;
    link.click();
  };
  
  const toggleFullscreen = () => {
    const whiteboard = document.getElementById('whiteboard-container');
    
    if (!fullscreen) {
      if (whiteboard.requestFullscreen) {
        whiteboard.requestFullscreen();
      } else if (whiteboard.webkitRequestFullscreen) {
        whiteboard.webkitRequestFullscreen();
      } else if (whiteboard.msRequestFullscreen) {
        whiteboard.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    
    setFullscreen(!fullscreen);
  };
  
  // Real-time collaboration can be implemented here
  // using WebSockets or other real-time communication technologies
  
  return (
    <div 
      id="whiteboard-container" 
      className="flex flex-col border border-gray-300 rounded-lg overflow-hidden"
      style={{ height: '80vh', width: '100%' }}
    >
      <div className="flex justify-between items-center p-2 bg-gray-100">
        <div className="flex space-x-2">
          <button 
            className={`p-2 rounded ${tool === 'pencil' ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            onClick={() => setTool('pencil')}
            title="Pencil"
          >
            <Pencil size={20} />
          </button>
          <button 
            className={`p-2 rounded ${tool === 'rect' ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            onClick={() => setTool('rect')}
            title="Rectangle"
          >
            <Square size={20} />
          </button>
          <button 
            className={`p-2 rounded ${tool === 'circle' ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            onClick={() => setTool('circle')}
            title="Circle"
          >
            <Circle size={20} />
          </button>
          <button 
            className={`p-2 rounded ${tool === 'text' ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            onClick={() => setTool('text')}
            title="Text"
          >
            <Type size={20} />
          </button>
          <button 
            className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <Eraser size={20} />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <input 
            type="color" 
            value={color}
            onChange={e => setColor(e.target.value)}
            className="cursor-pointer"
            title="Color"
          />
          <select 
            value={lineWidth}
            onChange={e => setLineWidth(parseInt(e.target.value))}
            className="p-1 border rounded"
            title="Line Width"
          >
            <option value="1">Thin</option>
            <option value="3">Normal</option>
            <option value="5">Thick</option>
            <option value="10">Very Thick</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="p-2 hover:bg-gray-200 rounded"
            onClick={handleUndo}
            title="Undo"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            className="p-2 hover:bg-gray-200 rounded"
            onClick={handleRedo}
            title="Redo"
          >
            <RotateCw size={20} />
          </button>
          <button 
            className="p-2 hover:bg-gray-200 rounded"
            onClick={handleClear}
            title="Clear"
          >
            <Trash size={20} />
          </button>
          <button 
            className="p-2 hover:bg-gray-200 rounded"
            onClick={handleSave}
            title="Save"
          >
            <Save size={20} />
          </button>
          <button 
            className="p-2 hover:bg-gray-200 rounded"
            onClick={toggleFullscreen}
            title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={finishDrawing}
        className="flex-1 bg-white"
        style={{ touchAction: 'none' }}
      />
      
      {roomId && (
        <div className="p-2 bg-gray-100 text-center">
          <p className="text-gray-600">Room ID: {roomId}</p>
          <p className="text-sm text-gray-500">Share this ID with others to collaborate</p>
        </div>
      )}
    </div>
  );
};

export default Whiteboard;