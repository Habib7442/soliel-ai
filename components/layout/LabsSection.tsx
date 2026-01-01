"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function LabsSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Hands-On Learning Labs
              </span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 max-w-2xl">
              Practice what you learn with our secure, containerized coding environments. No setup required - start coding immediately with real-world projects.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center mr-4 mt-1">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Interactive Coding</h3>
                  <p className="text-gray-600 dark:text-gray-400">Write and execute code directly in your browser</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center mr-4 mt-1">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Instant Execution</h3>
                  <p className="text-gray-600 dark:text-gray-400">See results immediately with our Docker sandbox</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center mr-4 mt-1">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Auto Grading</h3>
                  <p className="text-gray-600 dark:text-gray-400">Get instant feedback on your assignments</p>
                </div>
              </div>
            </div>
            
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground shadow-lg border-0"
              size="lg"
            >
              Try a Lab Demo
            </Button>
          </motion.div>
          
          <motion.div 
            className="flex-1 w-full"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-gray-800 px-4 py-2 flex items-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-gray-300 text-sm ml-4">python-lab.py</div>
              </div>
              <div className="p-6 font-mono text-sm">
                <div className="text-gray-500"># AI Machine Learning Lab</div>
                <div className="text-green-400">
                  <span className="text-purple-400">import</span> <span className="text-blue-400">pandas</span> <span className="text-purple-400">as</span> <span className="text-blue-400">pd</span>
                </div>
                <br />
                <div className="text-gray-400"># Load and analyze data</div>
                <div>
                  data = pd.read_csv(<span className="text-yellow-400">&#39;dataset.csv&#39;</span>)
                </div>
                <div>
                  <span className="text-purple-400">print</span>(data.head())
                </div>
                <br />
                <div className="text-gray-500">Output:</div>
                <div className="text-green-400">✓ Data loaded successfully</div>
                <div className="text-green-400">✓ 1000 rows, 5 columns</div>
                <div className="text-green-400">✓ Assignment completed</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}