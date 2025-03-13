import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  width?: number;
  height?: number;
}

export const SignaturePad = ({
  value,
  onChange,
  label = "Firma Digital",
  width = 500,
  height = 200
}: SignaturePadProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Load signature from value if it exists
  useEffect(() => {
    if (value && sigCanvas.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = sigCanvas.current?.getCanvas().getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setIsEmpty(false);
        }
      };
      img.src = value;
    }
  }, []);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    onChange('');
  };

  const save = () => {
    if (sigCanvas.current) {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      onChange(dataURL);
      setIsEmpty(false);
    }
  };

  const handleEnd = () => {
    setIsEmpty(sigCanvas.current?.isEmpty() || false);
    save();
  };

  return (
    <div className="grid w-full gap-1.5">
      <Label>{label}</Label>
      <div className="border border-input rounded-md p-1 bg-background">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width,
            height,
            className: 'signature-canvas w-full h-full'
          }}
          onEnd={handleEnd}
        />
      </div>
      <div className="flex justify-end space-x-2 mt-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={clear}
          disabled={isEmpty}
        >
          <Eraser className="h-4 w-4 mr-1" /> Borrar
        </Button>
        <Button 
          type="button" 
          variant="default" 
          size="sm"
          onClick={save}
          disabled={isEmpty}
        >
          <Check className="h-4 w-4 mr-1" /> Confirmar
        </Button>
      </div>
      {isEmpty && (
        <p className="text-xs text-muted-foreground mt-1">
          Firme en el recuadro utilizando el ratón o su dedo en pantallas táctiles
        </p>
      )}
    </div>
  );
};
