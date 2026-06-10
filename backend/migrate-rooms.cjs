const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://amitgharpayy_db_user:e5DhPtz9dTArSm02@cluster0.lbxpk8i.mongodb.net/?appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('ops');
    const roomsCol = db.collection('rooms');

    const rooms = await roomsCol.find().toArray();
    console.log(`Found ${rooms.length} rooms to migrate.`);

    // Group by propertyId
    const byProp = {};
    for (const r of rooms) {
      const pid = r.propertyId || 'unknown';
      if (!byProp[pid]) byProp[pid] = [];
      byProp[pid].push(r);
    }

    let updatedCount = 0;

    for (const [pid, propRooms] of Object.entries(byProp)) {
      // Sort to keep consistent order if possible, though _id is fine
      propRooms.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));

      for (let i = 0; i < propRooms.length; i++) {
        const room = propRooms[i];
        
        // 5 rooms per floor
        const floorNumber = Math.floor(i / 5) + 1;
        const roomIndexOnFloor = (i % 5) + 1; // 1 to 5
        
        // e.g. Floor 1 -> 101..105, Floor 2 -> 201..205
        const formattedRoomNumber = `${floorNumber}0${roomIndexOnFloor}`;

        await roomsCol.updateOne(
          { _id: room._id },
          { 
            $set: { 
              floorNumber: floorNumber,
              roomNumber: formattedRoomNumber,
              type: formattedRoomNumber // Some places use `type` as roomNumber fallback
            } 
          }
        );
        updatedCount++;
      }
    }

    console.log(`Successfully migrated ${updatedCount} rooms.`);

  } finally {
    await client.close();
  }
}

run().catch(console.error);
