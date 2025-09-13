import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SparklesIcon, LockIcon } from './icon/Icon';

interface ProFeatureBlockerProps {
    featureTitle: string;
    teaserText: string;
    children: React.ReactNode;
}

const ProFeatureBlocker: React.FC<ProFeatureBlockerProps> = ({ featureTitle, teaserText, children }) => {
    const { setIsUpgradeModalOpen } = useAuth();

    return (
        <div className="relative">
            <div className="blur-md select-none pointer-events-none">
                {children}
            </div>
            <div className="absolute inset-0 bg-content-bg/70 dark:bg-content-bg/80 backdrop-blur-sm flex flex-col justify-center items-center text-center p-4 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mb-3">
                    <LockIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-text-primary text-lg">Unlock {featureTitle}</h3>
                <p className="text-text-secondary my-2">{teaserText}</p>
                <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm"
                >
                    <SparklesIcon className="h-5 w-5" />
                    <span>Upgrade to Pro</span>
                </button>
            </div>
        </div>
    );
};

export default ProFeatureBlocker;
