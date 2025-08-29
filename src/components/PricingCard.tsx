import React from "react";
import { Check } from "lucide-react";

interface PricingCardProps {
  plan: {
    name: string;
    price: string;
    period: string;
    features: string[];
    cta: string;
    popular: boolean;
  };
  darkMode: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, darkMode }) => (
  <div
    className={`relative p-8 rounded-2xl border ${
      plan.popular
        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
        : darkMode
        ? "bg-gray-800 border-gray-700"
        : "bg-white border-gray-200"
    } hover:shadow-xl transition-all duration-300 hover:scale-105`}
  >
    {plan.popular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold">
          Most Popular
        </span>
      </div>
    )}

    <div className="text-center mb-8">
      <h3
        className={`text-2xl font-bold ${
          darkMode ? "text-white" : "text-gray-900"
        } mb-2`}
      >
        {plan.name}
      </h3>
      <div className="flex items-baseline justify-center space-x-1">
        <span
          className={`text-5xl font-bold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {plan.price}
        </span>
        <span
          className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          /{plan.period}
        </span>
      </div>
    </div>

    <ul className="space-y-4 mb-8">
      {plan.features.map((feature, index) => (
        <li key={index} className="flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            {feature}
          </span>
        </li>
      ))}
    </ul>

    <button
      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
        plan.popular
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
          : darkMode
          ? "bg-gray-700 text-white hover:bg-gray-600"
          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
      }`}
    >
      {plan.cta}
    </button>
  </div>
);

export default PricingCard;
