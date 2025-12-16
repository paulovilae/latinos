
import React from 'react';
import { MOCK_TESTIMONIALS } from '../constants';
import TestimonialCard from './TestimonialCard';
import ParallaxSection from './ParallaxSection';

const TestimonialsPage: React.FC = () => {
  return (
    <div className="animate-fade-in-up">
      <ParallaxSection imageUrl="https://picsum.photos/seed/testimonials_hero/1920/600" minHeight="min-h-[40vh]" overlayOpacity={0.6}>
        <h1 className="text-5xl font-bold text-white">What Our Users Say</h1>
        <p className="text-xl text-gray-200 mt-4 max-w-2xl">
          Hear directly from traders who have transformed their results with our platform.
        </p>
      </ParallaxSection>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_TESTIMONIALS.map(testimonial => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsPage;
    