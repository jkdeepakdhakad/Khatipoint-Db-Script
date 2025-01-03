const mongoose = require("mongoose");

const userMobileNumber = "7518388162";

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb+srv://admin:admin@dev0.7eufbyy.mongodb.net/khetipoint?retryWrites=true&w=majority"
    );
    console.log("Connected to the database!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
}

// Fetch data directly from the collection
async function fetchData() {
  try {
    const usersCollection = mongoose.connection.collection("user");
    const farmsCollection = mongoose.connection.collection("kp-farm");
    const expensesCollection = mongoose.connection.collection("kp-expenses");

    const pipeline = [
      { $match: { mobile: userMobileNumber } },
      {
        $lookup: {
          from: "kp-farm",
          localField: "_id",
          foreignField: "userId",
          as: "farms",
        },
      },
      { $unwind: "$farms" },
      {
        $lookup: {
          from: "kp-expenses",
          localField: "farms._id",
          foreignField: "farmId",
          as: "expenses",
        },
      },
      {
        $project: {
          name: 1,
          mobile: 1,
          "farms.name": 1,
          expenses: 1, // we will reshape the expenses below
          _id: 0,
        },
      },
    ];

    // Fetch data using the aggregation pipeline
    const users = await usersCollection.aggregate(pipeline).toArray();

    // Now, we'll process the data to merge expenses under the same farm
    const transformedData = users.map(user => {
      return {
        name: user.name.trim(),
        mobile: user.mobile,
        farms: { name: user.farms.name },
        expenses: user.expenses.map(expense => ({
          amount: expense.amount,
          name: expense.name,
        })),
      };
    });
    console.log('users:', users);
    console.log(JSON.stringify(transformedData, null, 2)); // Output the transformed data
    // return transformedData;
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    mongoose.connection.close(); // Close the connection
  }
}

// Main execution
async function main() {
  await connectDB();
  await fetchData();
}

main();