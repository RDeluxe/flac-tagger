import imageinfo from 'imageinfo'
import { MetadataBlockHeader, MetadataBlockHeaderLength, MetadataBlockType } from './header'
import { MetadataBlock } from './index'
import { allocBufferAndWrite } from '../buffer-base'

export enum PictureType {
  Other,
  FileIcon,
  OtherFileIcon,
  FrontCover,
  BackCover,
  LeafletPage,
  Media,
  LeadArtist,
  Artist,
  Conductor,
  Band,
  Composer,
  Lyricist,
  RecordingLocation,
  DuringRecording,
  DuringPerformance,
  MovieScreenCapture,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ABrightColouredFish,
  Illustration,
  BandLogotype,
  PublisherLogotype,
}
export class PictureBlock extends MetadataBlock {
  header: MetadataBlockHeader
  pictureType: PictureType
  mime: string
  description: string
  width: number
  height: number
  colorDepth: number
  colors: number
  pictureBuffer: Buffer

  constructor(initialValues: {
    header?: MetadataBlockHeader
    pictureType?: PictureType
    mime?: string
    description?: string
    width?: number
    height?: number
    colorDepth?: number
    colors?: number
    pictureBuffer: Buffer
  }) {
    super()
    const {
      header = new MetadataBlockHeader({
        type: MetadataBlockType.Picture,
      }),
      pictureType = PictureType.FrontCover,
      mime,
      description = '',
      width,
      height,
      colorDepth = 24,
      colors = 0,
      pictureBuffer,
    } = initialValues
    this.header = header
    this.pictureType = pictureType
    if (mime && width && height) {
      this.mime = mime
      this.width = width
      this.height = height
    } else {
      const info = imageinfo(pictureBuffer)
      this.mime = mime ?? info.mimeType
      this.width = width ?? info.width
      this.height = height ?? info.height
    }
    this.description = description
    this.colorDepth = colorDepth
    this.colors = colors
    this.pictureBuffer = pictureBuffer
  }

  static fromBuffer(buffer: Buffer) {
    let bufferIndex = 0

    const header = MetadataBlockHeader.fromBuffer(buffer)
    bufferIndex += header.length

    const pictureType = buffer.readUintBE(bufferIndex, 4) as PictureType
    bufferIndex += 4

    const mimeLength = buffer.readUintBE(bufferIndex, 4)
    bufferIndex += 4

    const mime = buffer.subarray(bufferIndex, bufferIndex + mimeLength).toString()
    bufferIndex += mimeLength

    const descriptionLength = buffer.readUintBE(bufferIndex, 4)
    bufferIndex += 4

    const description = buffer.subarray(bufferIndex, bufferIndex + descriptionLength).toString()
    bufferIndex += descriptionLength

    const width = buffer.readUintBE(bufferIndex, 4)
    bufferIndex += 4

    const height = buffer.readUintBE(bufferIndex, 4)
    bufferIndex += 4

    const colorDepth = buffer.readUintBE(bufferIndex, 4)
    bufferIndex += 4

    const colors = buffer.readUintBE(bufferIndex, 4)
    bufferIndex += 4

    const pictureDataLength = buffer.readUintBE(bufferIndex, 4)
    bufferIndex += 4

    const pictureBuffer = buffer.subarray(bufferIndex, bufferIndex + pictureDataLength)

    return new PictureBlock({
      header,
      pictureType,
      mime,
      description,
      width,
      height,
      colorDepth,
      colors,
      pictureBuffer,
    })
  }

  toBuffer() {
    return Buffer.concat([
      this.header.toBuffer(),
      allocBufferAndWrite(4, b => b.writeUint32BE(this.pictureType)),
      allocBufferAndWrite(4, b => b.writeUint32BE(Buffer.byteLength(this.mime))),
      Buffer.from(this.mime),
      allocBufferAndWrite(4, b => b.writeUint32BE(Buffer.byteLength(this.description))),
      Buffer.from(this.description),
      allocBufferAndWrite(4, b => b.writeUint32BE(this.width)),
      allocBufferAndWrite(4, b => b.writeUint32BE(this.height)),
      allocBufferAndWrite(4, b => b.writeUint32BE(this.colorDepth)),
      allocBufferAndWrite(4, b => b.writeUint32BE(this.colors)),
      allocBufferAndWrite(4, b => b.writeUint32BE(this.pictureBuffer.length)),
      this.pictureBuffer,
    ])
  }

  get length() {
    return (
      MetadataBlockHeaderLength +
      4 + // type length
      4 + // mime length
      Buffer.byteLength(this.mime) +
      4 + // description length
      Buffer.byteLength(this.description) +
      4 * 5 + // width, height, color depth, colors, picture data length
      this.pictureBuffer.length
    )
  }
}
