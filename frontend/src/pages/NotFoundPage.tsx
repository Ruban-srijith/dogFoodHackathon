import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <span className="text-8xl font-black font-mono text-emerald-400/20 select-none">404</span>
      <h1 className="text-2xl font-bold text-white mt-2">Page Not Found</h1>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">
        The route you requested does not exist or may have been relocated.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
