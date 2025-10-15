import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SafeImage from '../SafeImage';

// Mock the CSS import
jest.mock('../SafeImage.css', () => ({}));

describe('SafeImage Component', () => {
  it('renders with src and alt text', () => {
    render(
      <SafeImage 
        src="https://example.com/image.jpg" 
        alt="Test image" 
      />
    );
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('alt', 'Test image');
  });

  it('shows loading state initially', () => {
    render(
      <SafeImage 
        src="https://example.com/image.jpg" 
        alt="Test image" 
      />
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows CSS placeholder when all fallbacks fail', async () => {
    render(
      <SafeImage 
        src="invalid-url" 
        alt="Test image"
        placeholder="avatar"
      />
    );
    
    const image = screen.getByRole('img');
    
    // Simulate image load error
    fireEvent.error(image);
    
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Test image' })).toBeInTheDocument();
    });
  });

  it('uses correct placeholder type', () => {
    render(
      <SafeImage 
        src="invalid-url" 
        alt="Test image"
        placeholder="post"
      />
    );
    
    const image = screen.getByRole('img');
    fireEvent.error(image);
    
    expect(screen.getByRole('img', { name: 'Test image' })).toBeInTheDocument();
  });

  it('calls onError callback when image fails to load', () => {
    const onError = jest.fn();
    
    render(
      <SafeImage 
        src="invalid-url" 
        alt="Test image"
        onError={onError}
      />
    );
    
    const image = screen.getByRole('img');
    fireEvent.error(image);
    
    expect(onError).toHaveBeenCalled();
  });

  it('calls onLoad callback when image loads successfully', () => {
    const onLoad = jest.fn();
    
    render(
      <SafeImage 
        src="https://example.com/image.jpg" 
        alt="Test image"
        onLoad={onLoad}
      />
    );
    
    const image = screen.getByRole('img');
    fireEvent.load(image);
    
    expect(onLoad).toHaveBeenCalled();
  });
});