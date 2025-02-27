const { assert, skip, test, module: describe, only } = require('qunit');
const { GPU } = require('../../../../../..');

describe('feature: to-string unsigned precision constants Array2D');

function testConstant(mode, context, canvas) {
  const gpu = new GPU({ mode });
  const a = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ];
  const originalKernel = gpu.createKernel(
    function () {
      let sum = 0;
      for (let y = 0; y < 4; y++) {
        sum += this.constants.a[y][this.thread.x];
      }
      return sum;
    },
    {
      canvas,
      context,
      output: [4],
      precision: 'unsigned',
      constants: {
        a,
      },
    }
  );
  const expected = new Float32Array([28, 32, 36, 40]);
  const originalResult = originalKernel();
  assert.deepEqual(originalResult, expected);
  const kernelString = originalKernel.toString();
  const Kernel = new Function('return ' + kernelString)();
  const newResult = Kernel({ context, constants: { a } })();
  assert.deepEqual(newResult, expected);

  const b = [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
  ];
  const expected2 = new Float32Array([4, 4, 4, 4]);
  const newResult2 = Kernel({ context, constants: { a: b } })();
  assert.deepEqual(newResult2, expected2);
  gpu.destroy();
}

(GPU.isWebGLSupported ? test : skip)('webgl', () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl');
  testConstant('webgl', context, canvas);
});

(GPU.isWebGL2Supported ? test : skip)('webgl2', () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2');
  testConstant('webgl2', context, canvas);
});

(GPU.isHeadlessGLSupported ? test : skip)('headlessgl', () => {
  testConstant('headlessgl', require('gl')(1, 1), null);
});

test('cpu', () => {
  testConstant('cpu');
});
