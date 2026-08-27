declare module 'piexifjs' {
  export interface IExif {
    '0th'?: Record<number, any>;
    Exif?: Record<number, any>;
    GPS?: Record<number, any>;
    Interop?: Record<number, any>;
    '1st'?: Record<number, any>;
    thumbnail?: string | null;
  }

  export const ImageIFD: {
    ProcessingSoftware: number;
    NewSubfileType: number;
    SubfileType: number;
    ImageWidth: number;
    ImageLength: number;
    BitsPerSample: number;
    Compression: number;
    PhotometricInterpretation: number;
    Thresholding: number;
    CellWidth: number;
    CellLength: number;
    FillOrder: number;
    DocumentName: number;
    ImageDescription: number; // 270 (0x010E)
    Make: number;
    Model: number;
    StripOffsets: number;
    Orientation: number;
    SamplesPerPixel: number;
    RowsPerStrip: number;
    StripByteCounts: number;
    XResolution: number;
    YResolution: number;
    PlanarConfiguration: number;
    Software: number;
    DateTime: number;
    Artist: number;
    HostComputer: number;
    Predictor: number;
    WhitePoint: number;
    PrimaryChromaticities: number;
    ColorMap: number;
    HalftoneHints: number;
    TileWidth: number;
    TileLength: number;
    TileOffsets: number;
    TileByteCounts: number;
    SubIFDs: number;
    InkSet: number;
    InkNames: number;
    NumberOfInks: number;
    DotRange: number;
    TargetPrinter: number;
    ExtraSamples: number;
    SampleFormat: number;
    SMinSampleValue: number;
    SMaxSampleValue: number;
    TransferRange: number;
    ClipPath: number;
    XClipPathUnits: number;
    YClipPathUnits: number;
    Indexed: number;
    JPEGTables: number;
    OPIProxy: number;
    JPEGProc: number;
    JPEGInterchangeFormat: number;
    JPEGInterchangeFormatLength: number;
    JPEGRestartInterval: number;
    JPEGLosslessPredictors: number;
    JPEGPointTransforms: number;
    JPEGQTables: number;
    JPEGDCTables: number;
    JPEGACTables: number;
    YCbCrCoefficients: number;
    YCbCrSubSampling: number;
    YCbCrPositioning: number;
    ReferenceBlackWhite: number;
    XMLPacket: number;
    Rating: number;
    RatingPercent: number;
    ImageID: number;
    CFARepeatPatternDim: number;
    CFAPattern: number;
    BatteryLevel: number;
    Copyright: number;
    ExposureTime: number;
    FNumber: number;
    IPTCNAA: number;
    ImageResources: number;
    ExifTag: number;
    InterColorProfile: number;
    GPSTag: number;
    Interlace: number;
    TimeZoneOffset: number;
    SelfTimerMode: number;
    FlashEnergy: number;
    SpatialFrequencyResponse: number;
    Noise: number;
    FocalPlaneXResolution: number;
    FocalPlaneYResolution: number;
    FocalPlaneResolutionUnit: number;
    ImageNumber: number;
    SecurityClassification: number;
    ImageHistory: number;
    SubjectLocation: number;
    ExposureIndex: number;
    TIFFEPStandardID: number;
    SensingMethod: number;
    XPTitle: number;
    XPComment: number; // 40092
    XPAuthor: number;
    XPKeywords: number;
    XPSubject: number;
    [key: string]: number;
  };

  export const ExifIFD: {
    ExposureTime: number;
    FNumber: number;
    ExposureProgram: number;
    SpectralSensitivity: number;
    ISOSpeedRatings: number;
    OECF: number;
    SensitivityType: number;
    StandardOutputSensitivity: number;
    RecommendedExposureIndex: number;
    ISOSpeed: number;
    ISOSpeedLatitudeyyy: number;
    ISOSpeedLatitudezzz: number;
    ExifVersion: number;
    DateTimeOriginal: number;
    DateTimeDigitized: number;
    ComponentsConfiguration: number;
    CompressedBitsPerPixel: number;
    ShutterSpeedValue: number;
    ApertureValue: number;
    BrightnessValue: number;
    ExposureBiasValue: number;
    MaxApertureValue: number;
    SubjectDistance: number;
    MeteringMode: number;
    LightSource: number;
    Flash: number;
    FocalLength: number;
    SubjectArea: number;
    MakerNote: number;
    UserComment: number; // 37510 (0x9286)
    SubSecTime: number;
    SubSecTimeOriginal: number;
    SubSecTimeDigitized: number;
    FlashpixVersion: number;
    ColorSpace: number;
    PixelXDimension: number;
    PixelYDimension: number;
    RelatedSoundFile: number;
    InteroperabilityTag: number;
    [key: string]: number;
  };

  export const GPSIFD: Record<string, number>;
  export const TagValues: Record<string, any>;

  export function load(data: string): IExif;
  export function dump(exifObj: IExif): string;
  export function insert(exifStr: string, jpegData: string): string;
  export function remove(jpegData: string): string;

  export const helper: {
    encodeUserComment(comment: string): string;
    decodeUserComment(comment: string): string;
  };

  export default {
    ImageIFD,
    ExifIFD,
    GPSIFD,
    TagValues,
    load,
    dump,
    insert,
    remove,
    helper,
  };
}
