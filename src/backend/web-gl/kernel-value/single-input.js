import { utils } from '../../../utils';
import { WebGLKernelArray } from './array';

export class WebGLKernelValueSingleInput extends WebGLKernelArray {
  constructor(value, settings) {
    super(value, settings);
    this.bitRatio = 4;
    let [w, h, d] = value.size;
    this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(
      this.dimensions,
      this.bitRatio
    );
    this.uploadArrayLength =
      this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0], this.textureSize[1]);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
  }

  getStringValueHandler() {
    return utils.linesToString([
      `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
      `flattenTo(${this.varName}.value, uploadValue_${this.name})`,
    ]);
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(input) {
    if (input.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch(input.constructor);
      return;
    }
    const { context: gl } = this;
    utils.flattenTo(input.value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.textureSize[0],
      this.textureSize[1],
      0,
      gl.RGBA,
      gl.FLOAT,
      this.uploadValue
    );
    this.kernel.setUniform1i(this.id, this.index);
  }
}
