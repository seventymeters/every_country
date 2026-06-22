import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanEndonyms, displayEndonyms } from '../endonyms.js';

test('removes endonyms that are the same as the English exonym', () => {
  assert.deepEqual(cleanEndonyms(['Andorra'], 'Andorra'), []);
  assert.deepEqual(cleanEndonyms(['eSwatini'], 'Eswatini'), []);
});

test('removes duplicate endonyms that differ only by accents or format marks', () => {
  assert.deepEqual(cleanEndonyms(['Белару́сь', 'Беларусь'], 'Belarus'), ['Белару́сь']);
});

test('shows distinct endonyms without repeating the English exonym', () => {
  assert.equal(displayEndonyms(['الجزائر'], 'Algeria'), 'الجزائر');
  assert.equal(displayEndonyms(['Tchad', 'تشاد‎'], 'Chad'), 'Tchad, تشاد‎');
});
