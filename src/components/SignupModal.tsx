import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SignupModal: React.FC = () => {
    const { setIsSignupModalOpen, signup } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [region, setRegion] = useState<'AU' | 'US'>('AU');
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }
         if (!termsAgreed) {
            alert('You must agree to the terms to sign up.');
            return;
        }
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            signup(email, password, region);
            setIsLoading(false);
        }, 500);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={() => setIsSignupModalOpen(false)}
        >
            <div 
                className="bg-content-bg p-8 rounded-xl border border-border-color w-full max-w-sm"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-text-primary text-center mb-1">Create an Account</h2>
                <p className="text-text-secondary text-center mb-6">Start your journey to financial clarity.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email-signup" className="block text-sm font-medium text-text-secondary">Email Address</label>
                        <input
                            type="email"
                            id="email-signup"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password-signup" className="block text-sm font-medium text-text-secondary">Password</label>
                        <input
                            type="password"
                            id="password-signup"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="6+ characters"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="region-signup" className="block text-sm font-medium text-text-secondary">Region</label>
                        <select
                            id="region-signup"
                            value={region}
                            onChange={e => setRegion(e.target.value as 'AU' | 'US')}
                            className="mt-1 block w-full px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value="AU">Australia</option>
                            <option value="US">United States</option>
                        </select>
                    </div>
                     <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                checked={termsAgreed}
                                onChange={(e) => setTermsAgreed(e.target.checked)}
                                className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="terms" className="font-medium text-text-secondary">
                                I agree to the terms of service.
                            </label>
                            <p className="text-text-tertiary text-xs">By creating an account, you acknowledge that we are committed to your privacy; your personal and financial data is encrypted using bank-grade security and will never be sold or shared.</p>
                        </div>
                    </div>
                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={isLoading || !termsAgreed}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupModal;
