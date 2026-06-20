import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import RepresentativeCard from './RepresentativeCard';

afterEach(cleanup);

describe('RepresentativeCard', () => {
  it('renders the full name caption', () => {
    render(<RepresentativeCard fullName="Jane Q. Public" subtitle="Senator" />);
    // getByText throws if the element is absent, so these assertions fail loudly.
    expect(screen.getByText('Jane Q. Public')).toBeTruthy();
    expect(screen.getByText('Senator')).toBeTruthy();
  });

  it('falls back to initials when no photo is provided', () => {
    render(<RepresentativeCard fullName="Ada Lovelace" />);
    expect(screen.getByText('AL')).toBeTruthy();
  });
});
