const { assert, skip, test, module: describe, only } = require('qunit');
const { GPU } = require('../../../../../../..');

describe('feature: to-string unsigned precision object style returns Array3d');

function testReturn(mode, context, canvas) {
  const gpu = new GPU({ mode });
  function addOne(value) {
    return value + 1;
  }
  const originalKernel = gpu.createKernelMap(
    { addOneResult: addOne },
    function (a) {
      const result = a[this.thread.x] + 1;
      addOne(result);
      return result;
    },
    {
      canvas,
      context,
      output: [2, 2, 2],
      precision: 'unsigned',
    }
  );

  const a = [1, 2];
  const expected = [
    [new Float32Array([2, 3]), new Float32Array([2, 3])],
    [new Float32Array([2, 3]), new Float32Array([2, 3])],
  ];
  const expectedZero = [
    [new Float32Array([3, 4]), new Float32Array([3, 4])],
    [new Float32Array([3, 4]), new Float32Array([3, 4])],
  ];
  const originalResult = originalKernel(a);
  assert.deepEqual(originalResult.result, expected);
  assert.deepEqual(originalResult.addOneResult, expectedZero);
  const kernelString = originalKernel.toString(a);
  const newResult = new Function('return ' + kernelString)()({ context })(a);
  assert.deepEqual(newResult.result, expected);
  assert.deepEqual(newResult.addOneResult, expectedZero);
  gpu.destroy();
}

(GPU.isWebGLSupported ? test : skip)('webgl', () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl');
  testReturn('webgl', context, canvas);
});

(GPU.isWebGL2Supported ? test : skip)('webgl2', () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2');
  testReturn('webgl2', context, canvas);
});

(GPU.isHeadlessGLSupported ? test : skip)('headlessgl', () => {
  testReturn('headlessgl', require('gl')(1, 1), null);
});

test('cpu', () => {
  testReturn('cpu');
});
