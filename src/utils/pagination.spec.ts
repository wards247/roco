import { clampPageNumber, clampPageSize } from './pagination';

if (clampPageNumber(0, 12) !== 1) {
  throw new Error('page number should not go below 1');
}

if (clampPageNumber(99, 12) !== 12) {
  throw new Error('page number should not exceed total pages');
}

if (clampPageNumber(5, 12) !== 5) {
  throw new Error('valid page number should be preserved');
}

if (clampPageSize(0) !== 1) {
  throw new Error('page size should not go below 1');
}

if (clampPageSize(5000) !== 1000) {
  throw new Error('page size should not exceed 1000');
}

if (clampPageSize(50) !== 50) {
  throw new Error('valid page size should be preserved');
}
