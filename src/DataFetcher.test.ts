import DataFetcher from './DataFetcher';
import { firstDataLink } from './constants';

describe('DataFetcher', () => {
  it('fetches data successfully from an API', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ ChunkStart: 1627840923, Bars: [] }]), // Mocked response
    });
    global.fetch = fetchMock;
    const dataFetcher = new DataFetcher(firstDataLink);
    await expect(dataFetcher.fetchData()).resolves.toEqual([{ ChunkStart: 1627840923, Bars: [] }]);
    expect(fetchMock).toHaveBeenCalledWith(firstDataLink);
  });

  it('throws an error when the API call fails', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });
    global.fetch = fetchMock;
    const dataFetcher = new DataFetcher(firstDataLink);

    await expect(dataFetcher.fetchData()).rejects.toThrow('HTTP error! status: 404');
    expect(fetchMock).toHaveBeenCalledWith(firstDataLink);
  });
});
