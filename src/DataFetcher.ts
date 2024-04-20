import { DataChunk } from "./constants";

class DataFetcher {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async fetchData(): Promise<DataChunk[]> {
    try {
      console.log(222, this.url)
      const response = await fetch(this.url);
      if(!response.ok){
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const resultData: DataChunk[] = await response.json();
      return resultData; 
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
}

export default DataFetcher;