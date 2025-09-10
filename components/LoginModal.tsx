
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginModal: React.FC = () => {
    const { setIsLoginModalOpen, login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            login(email, password);
            setIsLoading(false);
        }, 500);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={() => setIsLoginModalOpen(false)}
        >
            <div 
                className="bg-content-bg p-8 rounded-xl border border-border-color w-full max-w-sm"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-text-primary text-center mb-1">Welcome Back</h2>
                <p className="text-text-secondary text-center mb-6">Log in to access your dashboard.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
                        >
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
