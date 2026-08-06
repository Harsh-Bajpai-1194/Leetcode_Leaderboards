/**
 * Code Complexity Calculator
 * Performs static analysis on algorithmic code (Java, C++, Python, JavaScript)
 * to estimate Time and Space complexity.
 */

export function calculateCodeComplexity(rawCode, problemTitle = '') {
  if (!rawCode || typeof rawCode !== 'string') {
    return {
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      timeReason: 'No operations detected',
      spaceReason: 'In-place execution',
      breakdown: ['Constant time execution']
    };
  }

  // 1. Clean code: Remove line & block comments
  let cleanCode = rawCode
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove /* ... */
    .replace(/\/\/.*/g, '')           // remove // ...
    .replace(/#.*/g, '');             // remove # ...

  const codeLower = cleanCode.toLowerCase();
  const titleLower = (problemTitle || '').toLowerCase();

  const breakdown = [];
  let timeComplexity = 'O(1)';
  let spaceComplexity = 'O(1)';
  let timeReason = 'Constant time operations';
  let spaceReason = 'Constant memory allocation';

  // --- SPECIAL OVERRIDES & PROBLEMS ---
  if (titleLower.includes('delete node')) {
    return {
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      timeReason: 'Direct node reference overwrite without list traversal',
      spaceReason: 'No extra memory allocated',
      breakdown: ['Node value replacement: O(1)', 'Pointer reallocation: O(1)']
    };
  }

  // --- TIME COMPLEXITY CALCULATOR ---

  // Check for Sorting
  const hasSort = /\b(sort|sorted|arrays\.sort|collections\.sort)\b/i.test(cleanCode);
  
  // Check for Binary Search
  const hasBinarySearch = /\b(mid|middle|left\s*<=\s*right|low\s*<=\s*high|binarysearch)\b/i.test(cleanCode) ||
    codeLower.includes('r - l') || codeLower.includes('right - left');

  // Check for Recursion
  const functionMatch = cleanCode.match(/(?:function|def|class|public|private|void|int|vector|boolean)\s+([a-zA-Z0-9_]+)\s*\(/i);
  let hasRecursion = false;
  if (functionMatch && functionMatch[1]) {
    const fnName = functionMatch[1];
    // Check if function name appears inside function body (excluding declaration)
    const occurrences = (cleanCode.match(new RegExp(`\\b${fnName}\\b`, 'g')) || []).length;
    if (occurrences >= 2) {
      hasRecursion = true;
    }
  }

  // Measure max loop nesting depth
  let maxLoopDepth = 0;
  let currentDepth = 0;
  const lines = cleanCode.split('\n');

  lines.forEach(line => {
    const isLoopStart = /\b(for|while|foreach)\b/i.test(line);
    if (isLoopStart) {
      currentDepth++;
      if (currentDepth > maxLoopDepth) {
        maxLoopDepth = currentDepth;
      }
    }
    // Decrement depth on closing braces
    const closeBraces = (line.match(/\}/g) || []).length;
    if (closeBraces > 0) {
      currentDepth = Math.max(0, currentDepth - closeBraces);
    }
  });

  // Calculate Time Complexity
  if (hasRecursion && maxLoopDepth >= 1) {
    timeComplexity = 'O(2^N)';
    timeReason = 'Recursive branching with nested iteration';
    breakdown.push('Recursive calls branching with loop iterations');
  } else if (hasRecursion) {
    if (hasBinarySearch) {
      timeComplexity = 'O(log N)';
      timeReason = 'Recursive divide and conquer / binary reduction';
      breakdown.push('Halving input size recursively: O(log N)');
    } else {
      timeComplexity = 'O(N)';
      timeReason = 'Single recursive traversal over N elements';
      breakdown.push('Linear recursive call stack');
    }
  } else if (maxLoopDepth >= 3) {
    timeComplexity = 'O(N³)';
    timeReason = 'Triple nested loops detected';
    breakdown.push('3 levels of nested loops: O(N * N * N)');
  } else if (maxLoopDepth === 2) {
    timeComplexity = 'O(N²)';
    timeReason = 'Double nested loops detected';
    breakdown.push('Nested loop iteration: O(N * N)');
  } else if (hasSort) {
    if (maxLoopDepth >= 1) {
      timeComplexity = 'O(N log N)';
      timeReason = 'Sorting combined with linear iteration';
      breakdown.push('Sorting O(N log N) + linear iteration O(N)');
    } else {
      timeComplexity = 'O(N log N)';
      timeReason = 'Sorting algorithm complexity';
      breakdown.push('Optimal sorting threshold: O(N log N)');
    }
  } else if (hasBinarySearch) {
    timeComplexity = 'O(log N)';
    timeReason = 'Binary search halving space at each step';
    breakdown.push('Logarithmic reduction pattern');
  } else if (maxLoopDepth === 1) {
    timeComplexity = 'O(N)';
    timeReason = 'Single linear loop traversal';
    breakdown.push('Linear scan over input elements');
  } else {
    timeComplexity = 'O(1)';
    timeReason = 'Constant number of operations executed';
    breakdown.push('No loops or recursion detected');
  }


  // --- SPACE COMPLEXITY CALCULATOR ---

  const has2DArray = /\[\s*\]\s*\[\s*\]/i.test(cleanCode) || 
    /vector\s*<\s*vector/i.test(cleanCode) || 
    /new\s+[a-zA-Z0-9_]+\s*\[[^\]]+\]\s*\[[^\]]+\]/i.test(cleanCode);

  const has1DArrayOrDS = /\b(new\s+[a-zA-Z0-9_]+\s*\[|stack|queue|hashmap|hashset|map|set|vector|list|dict|seen)\b/i.test(cleanCode) ||
    /\[\]|\{\}/.test(cleanCode);

  if (has2DArray) {
    spaceComplexity = 'O(N²)';
    spaceReason = '2D matrix / DP table allocated';
    breakdown.push('2D array or matrix allocation: O(N * M)');
  } else if (has1DArrayOrDS || hasRecursion) {
    spaceComplexity = 'O(N)';
    spaceReason = hasRecursion ? 'Recursion stack depth' : 'Auxiliary data structure (Map/Set/Array)';
    breakdown.push(hasRecursion ? 'Call stack memory: O(N)' : 'Auxiliary array/hash map storage: O(N)');
  } else {
    spaceComplexity = 'O(1)';
    spaceReason = 'Constant in-place memory usage';
    breakdown.push('In-place operation without dynamic allocation');
  }

  return {
    timeComplexity,
    spaceComplexity,
    timeReason,
    spaceReason,
    breakdown
  };
}
