"use client";

import { Leaf, Wheat, Droplet, Sun, Zap } from 'lucide-react';

const highlights = [
  {
    icon: <Leaf className="h-8 w-8 text-green-600" />,
    label: "50% More Fibre"
  },
  {
    icon: <Wheat className="h-8 w-8 text-yellow-600" />,
    label: "Heirloom Variety"
  },
  {
    icon: <Droplet className="h-8 w-8 text-blue-500" />,
    label: "50% Less Gluten"
  },
  {
    icon: <Sun className="h-8 w-8 text-orange-500" />,
    label: "Stoneground"
  }
]

const BadgeIcon = () => (
    <svg width="80" height="80" viewBox="0 0 100 100" className="absolute top-4 right-4 h-20 w-20 opacity-10">
        <g transform="rotate(15 50 50)">
            <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" fill="hsl(var(--primary))" />
            <text x="50" y="45" textAnchor="middle" dy=".3em" fill="white" fontSize="12" fontWeight="bold">MANUFACTURED</text>
            <text x="50" y="60" textAnchor="middle" dy=".3em" fill="white" fontSize="12" fontWeight="bold">IN-HOUSE</text>
        </g>
    </svg>
)

const ProductHighlights = () => {
  return (
    <div className="my-6 relative">
        <BadgeIcon />
        <div className="grid grid-cols-4 gap-4 text-center">
        {highlights.map(item => (
            <div key={item.label} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                {item.icon}
                <span className="text-xs font-semibold text-foreground">{item.label}</span>
            </div>
        ))}
        </div>
    </div>
  )
}

export default ProductHighlights;
