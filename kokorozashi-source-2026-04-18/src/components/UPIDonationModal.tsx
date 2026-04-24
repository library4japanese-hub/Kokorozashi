import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Smartphone, Info, Heart, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface UPIDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId: string;
  payeeName: string;
}

const UPIDonationModal: React.FC<UPIDonationModalProps> = ({ isOpen, onClose, upiId, payeeName }) => {
  const [amount, setAmount] = useState('500');
  const [copied, setCopied] = useState(false);

  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Donation%20for%20Kokorozashi`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass rounded-[2.5rem] border border-white/10 w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 md:p-8 pb-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center text-white shadow-lg shadow-brand/20">
                  <Heart size={24} className="fill-current" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">Support Sensei</h3>
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">Donate via UPI</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 pt-4 space-y-8">
              {/* Amount Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Select Amount</label>
                <div className="grid grid-cols-3 gap-3">
                  {['100', '500', '1000'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={cn(
                        "py-3 rounded-2xl border-2 font-black transition-all text-sm active:scale-95 touch-manipulation",
                        amount === val 
                          ? "border-brand bg-brand/10 text-brand-light" 
                          : "border-white/5 bg-white/5 text-white/40 hover:border-white/10"
                      )}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand font-black">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Custom goal..."
                    className="w-full pl-12 pr-6 py-4 glass border border-white/10 rounded-2xl text-sm text-white font-bold outline-none focus:border-brand/50 transition-all"
                  />
                </div>
              </div>

              {/* QR Code Section */}
              <div className="relative group">
                <div className="absolute -inset-1 brand-gradient rounded-[2rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-[#FFFFFF] p-6 rounded-[2rem] flex flex-col items-center">
                  <div className="bg-white p-2 rounded-xl">
                    <QRCodeSVG 
                      value={upiUrl} 
                      size={180}
                      level="H"
                      includeMargin={false}
                      fgColor="#050714"
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[#050714]/40 text-[10px] font-black uppercase tracking-widest">
                    <Smartphone className="w-4 h-4" />
                    <span>Scan with any UPI APP</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <a
                  href={upiUrl}
                  className="w-full py-5 bg-brand text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-brand-light transition-all shadow-lg shadow-brand/20 active:scale-95"
                >
                  Pay via App
                  <ArrowRight size={16} />
                </a>

                <button
                  onClick={copyToClipboard}
                  className="w-full py-4 glass text-white/60 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/5 transition-all border border-white/5"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy UPI ID: <span className="text-brand-light">{upiId}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Footer Info */}
              <div className="flex gap-4 p-5 glass bg-white/5 rounded-3xl border border-white/10">
                <Info className="w-5 h-5 flex-shrink-0 text-brand-light" />
                <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-wide">
                  Your contribution helps keep Kokorozashi free for everyone. 
                  <span className="text-white ml-1">Arigato gozaimasu!</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UPIDonationModal;
