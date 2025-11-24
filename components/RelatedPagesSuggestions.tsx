import React from 'react';
import Link from 'next/link';

interface RelatedPagesSuggestionsProps {
  currentPath?: string;
}

/**
 * Component that suggests related pages to the user
 */
const RelatedPagesSuggestions: React.FC<RelatedPagesSuggestionsProps> = ({ currentPath }) => {
  // Default suggestions based on common pages
  const suggestions = [
    { title: 'Home', path: '/', description: 'Go back to the homepage' },
    { title: 'Workflow', path: '/workflow', description: 'View content workflow' },
    { title: 'Platform Analysis', path: '/platform-analysis', description: 'Analyze platforms' },
    { title: 'Content Adaptation', path: '/content-adaptation', description: 'Adapt content' },
  ];

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">You might also be interested in:</h3>
      <ul className="space-y-2">
        {suggestions.map(suggestion => (
          <li key={suggestion.path}>
            <Link
              href={suggestion.path}
              className="text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              {suggestion.title}
            </Link>
            {suggestion.description && (
              <span className="ml-2 text-sm text-gray-500">{suggestion.description}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RelatedPagesSuggestions;
