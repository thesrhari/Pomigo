import React from "react";
import { ArrowRight, Shield, Globe, Coffee } from "lucide-react";

interface CTABannerProps {
  darkMode: boolean;
}

const CTABanner: React.FC<CTABannerProps> = ({ darkMode }) => {
  return (
    <section
      className={`py-20 ${
        darkMode
          ? "bg-gradient-to-r from-blue-900 to-purple-900"
          : "bg-gradient-to-r from-blue-600 to-purple-600"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to Transform Your Study Habits?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Join thousands of students building consistent study habits with
          Pomigo. Start your journey today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            Get Started Free
            <ArrowRight className="w-5 h-5 inline-block ml-2" />
          </button>
          <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200">
            Contact Sales
          </button>
        </div>

        <div className="flex items-center justify-center space-x-8 mt-12">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-200" />
            <span className="text-blue-100">Secure & Private</span>
          </div>
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-200" />
            <span className="text-blue-100">Available Worldwide</span>
          </div>
          <div className="flex items-center space-x-2">
            <Coffee className="w-5 h-5 text-blue-200" />
            <span className="text-blue-100">24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
