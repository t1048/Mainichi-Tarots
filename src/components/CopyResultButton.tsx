import { useState } from 'preact/hooks';
import { Button } from './Button';
import { copyText } from '../lib/copy';

interface Props {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function CopyResultButton({
  text,
  label = '結果をコピー',
  copiedLabel = 'コピーしました',
  variant = 'secondary',
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button variant={variant} onClick={handleCopy} disabled={!text}>
      {copied ? copiedLabel : label}
    </Button>
  );
}
