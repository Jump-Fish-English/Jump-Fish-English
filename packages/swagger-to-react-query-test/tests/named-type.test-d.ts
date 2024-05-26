import { describe, it, expectTypeOf } from 'vitest';
import { type Instance } from '../dist/types/Instance';

describe('Instance', () => {
  it('should output expected interfact', () => {
   expectTypeOf({
    pointer: 'string',
   }).toEqualTypeOf<Instance>();
  });
})