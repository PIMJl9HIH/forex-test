// interfaces 
export interface Bar {
  Time: number;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  TickVolume: number;
}

// Define the structure of the entire data chunk
export interface DataChunk {
  Bars: Bar[];
  ChunkStart: number;
}

// constants
export const firstDataLink = 'https://beta.forextester.com/data/api/Metadata/bars/chunked?Broker=Advanced&Symbol=EURUSD&Timeframe=1&Start=57674&End=59113&UseMessagePack=false';

export const secondDataLink = 'https://beta.forextester.com/data/api/Metadata/bars/chunked?Broker=Advanced&Symbol=USDJPY&Timeframe=1&Start=57674&End=59113&UseMessagePack=false'