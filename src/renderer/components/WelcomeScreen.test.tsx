import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeScreen } from './WelcomeScreen';

describe('WelcomeScreen', () => {
  const mockOnSelectCard = vi.fn();

  beforeEach(() => {
    mockOnSelectCard.mockClear();
  });

  describe('Normal display (no error)', () => {
    it('should render the welcome message', () => {
      render(<WelcomeScreen onSelectCard={mockOnSelectCard} />);

      expect(screen.getByText('Welcome to Multigrain Sample Manager')).toBeInTheDocument();
      expect(
        screen.getByText('Manage and organize your Intellijel Multigrain sample library with ease')
      ).toBeInTheDocument();
    });

    it('should render the Select SD Card button', () => {
      render(<WelcomeScreen onSelectCard={mockOnSelectCard} />);

      const button = screen.getByRole('button', { name: /select your sd card/i });
      expect(button).toBeInTheDocument();
    });

    it('should call onSelectCard when button is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen onSelectCard={mockOnSelectCard} />);

      const button = screen.getByRole('button', { name: /select your sd card/i });
      await user.click(button);

      expect(mockOnSelectCard).toHaveBeenCalledTimes(1);
    });

    it('should render all feature sections', () => {
      render(<WelcomeScreen onSelectCard={mockOnSelectCard} />);

      expect(screen.getByText('Browse & Preview')).toBeInTheDocument();
      expect(screen.getByText('Import & Convert')).toBeInTheDocument();
      expect(screen.getByText('Organize Projects')).toBeInTheDocument();
      expect(screen.getByText('View Presets')).toBeInTheDocument();
    });

    it('should render the Getting Started section', () => {
      render(<WelcomeScreen onSelectCard={mockOnSelectCard} />);

      expect(screen.getByText(/🚀/)).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText(/Browse projects in the tree/)).toBeInTheDocument();
      expect(screen.getByText(/Load Factory Names/)).toBeInTheDocument();
    });

    it('should render the auto-conversion tip', () => {
      render(<WelcomeScreen onSelectCard={mockOnSelectCard} />);

      expect(screen.getByText(/💡 Tip:/)).toBeInTheDocument();
      expect(
        screen.getByText(/automatically converted to the correct format for Multigrain/)
      ).toBeInTheDocument();
    });

    it('should not render error warning when no error is provided', () => {
      render(<WelcomeScreen onSelectCard={mockOnSelectCard} />);

      expect(screen.queryByText(/⚠️ Previous location not accessible:/)).not.toBeInTheDocument();
    });
  });

  describe('Error display', () => {
    it('should render error warning with path when error and previousPath are provided', () => {
      const error = 'Cannot access the selected path';
      const previousPath = '/Volumes/NO_NAME';

      render(
        <WelcomeScreen onSelectCard={mockOnSelectCard} error={error} previousPath={previousPath} />
      );

      expect(screen.getByText(/⚠️ Previous location not accessible:/)).toBeInTheDocument();
      expect(screen.getByText(previousPath)).toBeInTheDocument();
      expect(screen.getByText(/Please select your SD card location below/)).toBeInTheDocument();
    });

    it('should render error warning without path when error is provided but no previousPath', () => {
      const error = 'Cannot access the selected path';

      render(<WelcomeScreen onSelectCard={mockOnSelectCard} error={error} />);

      expect(screen.getByText(/⚠️ Previous location not accessible:/)).toBeInTheDocument();
      expect(screen.getByText(/Please select your SD card location below/)).toBeInTheDocument();
    });

    it('should not render error warning when only previousPath is provided without error', () => {
      const previousPath = '/Volumes/NO_NAME';

      render(<WelcomeScreen onSelectCard={mockOnSelectCard} previousPath={previousPath} />);

      expect(screen.queryByText(/⚠️ Previous location not accessible:/)).not.toBeInTheDocument();
    });

    it('should still render welcome content when error is shown', () => {
      const error = 'Cannot access the selected path';
      const previousPath = '/Volumes/NO_NAME';

      render(
        <WelcomeScreen onSelectCard={mockOnSelectCard} error={error} previousPath={previousPath} />
      );

      // Error should be shown
      expect(screen.getByText(/⚠️ Previous location not accessible:/)).toBeInTheDocument();

      // Welcome content should still be present
      expect(screen.getByText('Welcome to Multigrain Sample Manager')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select your sd card/i })).toBeInTheDocument();
    });

    it('should call onSelectCard when button is clicked even with error', async () => {
      const user = userEvent.setup();
      const error = 'Cannot access the selected path';

      render(<WelcomeScreen onSelectCard={mockOnSelectCard} error={error} />);

      const button = screen.getByRole('button', { name: /select your sd card/i });
      await user.click(button);

      expect(mockOnSelectCard).toHaveBeenCalledTimes(1);
    });
  });
});
