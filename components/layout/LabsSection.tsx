"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Code2, Cpu, Zap, CheckCircle } from "lucide-react";

export function LabsSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
          <motion.div 
            className="flex-1 order-2 lg:order-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="w-4 h-4 text-primary fill-current" />
              <span className="text-sm font-bold text-primary tracking-tight">Zero Setup Required</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-[1.1]">
              Learn by <span className="text-primary italic">Doing.</span> <br />
              Interactive Labs.
            </h2>
            
            <p className="text-xl text-muted-foreground/80 mb-10 max-w-xl leading-relaxed">
              Don't just watch videos. Dive into our secure, browser-based coding environments and build real AI projects from Day 1.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {[
                { icon: Code2, title: "Pure Code", desc: "Full IDE experience in your browser" },
                { icon: Cpu, title: "AI Powered", desc: "Instant feedback on every line" }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                  <item.icon className="w-8 h-8 text-primary mb-4" />
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                </div>
              ))}
            </div>

            <Button size="xl" className="rounded-2xl bg-gray-900 hover:bg-primary text-white font-bold px-10 transition-all active:scale-95 border-0">
              Launch Sandbox
            </Button>
          </motion.div>
          
          <motion.div 
            className="flex-1 w-full order-1 lg:order-2"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl border border-gray-800">
                <div className="bg-gray-800/50 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-800">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.3)]"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                  </div>
                  <div className="text-gray-500 text-xs font-mono uppercase tracking-widest">ai-model-trainer.py</div>
                  <div className="w-10"></div>
                </div>
                
                <div className="p-8 font-mono text-sm sm:text-base -space-y-0.5">
                  <div className="text-gray-600 mb-2"># Initializing Brain Core...</div>
                  <div className="flex gap-4">
                    <span className="text-gray-700">1</span>
                    <span className="text-purple-400">from</span> <span className="text-blue-400">soliel_ai</span> <span className="text-purple-400">import</span> <span className="text-cyan-400">NeuralEngine</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-700">2</span>
                    <span>&nbsp;</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-700">3</span>
                    <span>engine = NeuralEngine(model=<span className="text-yellow-400">"gpt-4"</span>)</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-700">4</span>
                    <span className="text-blue-400">engine</span>.train(dataset=<span className="text-green-400">"marketing_data"</span>)
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-700">5</span>
                    <span>&nbsp;</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-800 space-y-2">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Processing Layers [100%]</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Zap className="w-4 h-4 fill-current" />
                      <span className="text-xs text-secondary-foreground">Efficiency: +14.2% optimized</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Float Badge */}
              <motion.div 
                className="absolute -top-8 -right-8 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 hidden sm:block"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
                    <p className="text-sm font-bold text-gray-900 leading-none">All Tests Passed</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}