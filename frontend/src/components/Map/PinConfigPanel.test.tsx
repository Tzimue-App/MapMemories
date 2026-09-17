import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PinConfigPanel } from './PinConfigPanel';
import { PinItem, PIN_COLOR_OPTIONS } from '../../types/pin';

describe('PinConfigPanel Component', () => {
  const mockPin: PinItem = {
    id: 'pin-1',
    lat: 48.8566,
    lng: 2.3522,
    radiusMeters: 1000,
    color: '#3B82F6',
  };

  const defaultProps = {
    pin: mockPin,
    onRadiusChange: vi.fn(),
    onColorChange: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders pin details, radius controls, color picker, and delete button', () => {
    render(<PinConfigPanel {...defaultProps} />);

    // Check header or radius display
    const radiusDisplays = screen.getAllByText(/1000 m/i);
    expect(radiusDisplays.length).toBeGreaterThan(0);
    expect(radiusDisplays[0]).toBeInTheDocument();

    // Check radius slider input
    const slider = screen.getByRole('slider', { name: /radius/i });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('1000');

    // Check color choices rendering
    PIN_COLOR_OPTIONS.forEach((color) => {
      expect(screen.getByTitle(color.label)).toBeInTheDocument();
    });

    // Check delete button
    expect(screen.getByRole('button', { name: /delete pin/i })).toBeInTheDocument();
  });

  it('calls onRadiusChange when slider value changes', () => {
    const onRadiusChange = vi.fn();
    render(<PinConfigPanel {...defaultProps} onRadiusChange={onRadiusChange} />);

    const slider = screen.getByRole('slider', { name: /radius/i });
    fireEvent.change(slider, { target: { value: '2500' } });

    expect(onRadiusChange).toHaveBeenCalledWith(2500);
  });

  it('calls onRadiusChange when preset button is clicked', () => {
    const onRadiusChange = vi.fn();
    render(<PinConfigPanel {...defaultProps} onRadiusChange={onRadiusChange} />);

    const presetBtn = screen.getByRole('button', { name: /500m/i });
    fireEvent.click(presetBtn);

    expect(onRadiusChange).toHaveBeenCalledWith(500);
  });

  it('calls onRadiusChange(0) when Off preset button is clicked', () => {
    const onRadiusChange = vi.fn();
    render(<PinConfigPanel {...defaultProps} onRadiusChange={onRadiusChange} />);

    const offBtn = screen.getByRole('button', { name: /off/i });
    fireEvent.click(offBtn);

    expect(onRadiusChange).toHaveBeenCalledWith(0);
  });

  it('renders disabled state when radiusMeters is 0 or radiusDisabled is true', () => {
    const disabledPin: PinItem = {
      ...mockPin,
      radiusMeters: 0,
      radiusDisabled: true,
    };
    render(<PinConfigPanel {...defaultProps} pin={disabledPin} />);

    const disabledTexts = screen.getAllByText(/radius disabled/i);
    expect(disabledTexts.length).toBeGreaterThan(0);
    expect(disabledTexts[0]).toBeInTheDocument();
  });

  it('calls onColorChange when color swatch is clicked', () => {
    const onColorChange = vi.fn();
    render(<PinConfigPanel {...defaultProps} onColorChange={onColorChange} />);

    const redColorSwatch = screen.getByTitle('Red');
    fireEvent.click(redColorSwatch);

    expect(onColorChange).toHaveBeenCalledWith('#EF4444');
  });

  it('calls onDelete and stops click event propagation when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<PinConfigPanel {...defaultProps} onDelete={onDelete} />);

    const deleteBtn = screen.getByRole('button', { name: /delete pin/i });

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

    fireEvent(deleteBtn, clickEvent);

    expect(onDelete).toHaveBeenCalledWith('pin-1');
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
