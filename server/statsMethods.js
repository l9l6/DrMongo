const wrapStatsCall = Meteor.wrapAsync((connection, collection, cb) => {
  connection.collection(collection.name).stats((error, stats) => {
    if(error) {
      throw new Meteor.Error('stats.collection', error.message);
    } else {
      cb(null, stats);
    }
  });
});

Meteor.methods({
  'stats.rawCollectionStats'(collectionId) {
    const collection = Collections.findOne(collectionId);
    const db = connectDatabase(collection.database_id);

    const stats = wrapStatsCall(db, collection);

    db.close();
    return stats;
  },

  'stats.fetchCollectionsStats'(databaseId) {
    check(databaseId, String);

    const database = Databases.findOne(databaseId);
    const connection = connectDatabase(databaseId);

    database.collections().map(collection => {
      const stats = wrapStatsCall(connection, collection);
      const indexes = [];
      _.each(stats.indexSizes, (value, key) => {
        indexes.push(key);
      });

      Collections.update(collection._id, {$set: {
        stats: {
          size: stats.size,
          documentsCount: stats.count,
          indexes
        }
      }});
    });


  }
});
