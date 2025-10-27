// src/appwriteSearchCount.js
import { Client, TablesDB, ID, Query } from 'appwrite';

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = import.meta.env.VITE_APPWRITE_TABLE_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

const tablesDB = new TablesDB(client);

/**
 * Updates the search count for a given searchTerm and movie.
 * If a row with that searchTerm already exists, increments its count.
 * Otherwise, creates a new row with count = 1.
 *
 * @param {string} searchTerm  - The term user searched for
 * @param {object} movie       - Movie object, should have .id and .poster_url
 */
export async function updateSearchCount(searchTerm, movie) {
    try {
        // 1) Check if row exists
        const listResult = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: TABLE_ID,
            queries: [
                Query.equal('searchTerm', searchTerm)
            ],
        });

        if (listResult.rows && listResult.rows.length > 0) {
            // Row exists → update
            const row = listResult.rows[0];
            await tablesDB.updateRow({
                databaseId: DATABASE_ID,
                tableId: TABLE_ID,
                rowId: row.$id,
                data: {
                    count: (row.count || 0) + 1
                },
            });
        } else {
            // Row does *not* exist → create new
            await tablesDB.createRow({
                databaseId: DATABASE_ID,
                tableId: TABLE_ID,
                rowId: ID.unique(),
                data: {
                    searchTerm: searchTerm,
                    count: 1,
                    movie_id: movie.id,
                    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_url}`
                },
                permissions: ['read("any")']  // permission public read, adjust if needed
            });
        }
    } catch (error) {
        console.error('Error updating search count:', error);
    }
}
