"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function QuizSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="bg-gradient-to-br from-[#FF6B35]/5 to-[#FF914D]/5 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] bg-clip-text text-transparent">
                Test Your AI Knowledge
              </span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 max-w-2xl">
              Take our interactive quiz to assess your understanding of AI and machine learning concepts. Get instant feedback and track your progress.
            </p>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow text-center">
                <div className="text-3xl font-bold text-[#FF6B35] mb-2">3</div>
                <div className="text-gray-600 dark:text-gray-400">Questions</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow text-center">
                <div className="text-3xl font-bold text-[#FF6B35] mb-2">5</div>
                <div className="text-gray-600 dark:text-gray-400">Minutes</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow text-center">
                <div className="text-3xl font-bold text-[#FF6B35] mb-2">AI/ML</div>
                <div className="text-gray-600 dark:text-gray-400">Topic</div>
              </div>
            </div>
            
            <Button 
              className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088] text-white shadow-lg"
              size="lg"
            >
              Start Quiz
            </Button>
          </motion.div>
          
          <motion.div 
            className="flex-1 w-full"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Sample Question</h3>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Which algorithm is commonly used for classification tasks in machine learning?
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Linear Regression</span>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-5 h-5 rounded-full border-2 border-[#FF6B35] mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Random Forest</span>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">K-Means Clustering</span>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Principal Component Analysis</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Select the best answer to test your knowledge
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}