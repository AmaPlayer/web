import {
  validateComment,
  validateEmail,
  validatePassword,
  validateUsername,
  sanitizeText,
  isWhitespaceOnly,
  getCharacterCount
} from '../validation';

describe('Validation Utils', () => {
  describe('validateComment', () => {
    it('validates valid comments', () => {
      const result = validateComment('This is a valid comment');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects empty comments', () => {
      const result = validateComment('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment cannot be empty');
    });

    it('rejects comments that are too short', () => {
      const result = validateComment('Hi', { minLength: 5 });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment must be at least 5 characters long');
    });

    it('rejects comments that are too long', () => {
      const longComment = 'a'.repeat(501);
      const result = validateComment(longComment);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment cannot exceed 500 characters');
    });

    it('rejects comments with forbidden words', () => {
      const result = validateComment('This is spam content', {
        forbiddenWords: ['spam']
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment contains inappropriate content');
    });

    it('rejects comments without alphanumeric characters when required', () => {
      const result = validateComment('!!!', { requireAlphanumeric: true });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment must contain at least one letter or number');
    });

    it('detects spam patterns', () => {
      const result = validateComment('aaaaaaaaa'); // More than 5 repeated characters
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment appears to be spam');
    });

    it('allows empty comments when allowEmpty is true', () => {
      const result = validateComment('', { allowEmpty: true });
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('rejects empty emails', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
    });

    it('rejects short passwords', () => {
      const result = validatePassword('short');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
    });

    it('requires lowercase letters', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one lowercase letter');
    });

    it('requires uppercase letters', () => {
      const result = validatePassword('lowercase123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one uppercase letter');
    });

    it('requires numbers', () => {
      const result = validatePassword('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one number');
    });
  });

  describe('validateUsername', () => {
    it('validates correct usernames', () => {
      const result = validateUsername('valid_user-123');
      expect(result.isValid).toBe(true);
    });

    it('rejects short usernames', () => {
      const result = validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Username must be at least 3 characters long');
    });

    it('rejects long usernames', () => {
      const result = validateUsername('a'.repeat(31));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Username cannot exceed 30 characters');
    });

    it('rejects usernames with invalid characters', () => {
      const result = validateUsername('user@name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Username can only contain letters, numbers, underscores, and hyphens');
    });

    it('rejects usernames starting or ending with underscore/hyphen', () => {
      let result = validateUsername('_username');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Username cannot start or end with underscore or hyphen');

      result = validateUsername('username-');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Username cannot start or end with underscore or hyphen');
    });
  });

  describe('sanitizeText', () => {
    it('sanitizes HTML characters', () => {
      const result = sanitizeText('<script>alert("xss")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('sanitizes quotes and apostrophes', () => {
      const result = sanitizeText(`"Hello" and 'World'`);
      expect(result).toBe('&quot;Hello&quot; and &#x27;World&#x27;');
    });
  });

  describe('isWhitespaceOnly', () => {
    it('detects whitespace-only strings', () => {
      expect(isWhitespaceOnly('   ')).toBe(true);
      expect(isWhitespaceOnly('\t\n')).toBe(true);
      expect(isWhitespaceOnly('')).toBe(true);
    });

    it('detects non-whitespace strings', () => {
      expect(isWhitespaceOnly('hello')).toBe(false);
      expect(isWhitespaceOnly('  hello  ')).toBe(false);
    });
  });

  describe('getCharacterCount', () => {
    it('calculates character count correctly', () => {
      const result = getCharacterCount('hello', 10);
      expect(result.count).toBe(5);
      expect(result.remaining).toBe(5);
      expect(result.isOverLimit).toBe(false);
    });

    it('detects over-limit text', () => {
      const result = getCharacterCount('hello world', 5);
      expect(result.count).toBe(11);
      expect(result.remaining).toBe(-6);
      expect(result.isOverLimit).toBe(true);
    });
  });
});