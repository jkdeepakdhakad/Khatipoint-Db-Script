const mongoose = require("mongoose");

const userMobileNumber = "7518388162";
const language = "english";

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
    // Access the collection directly without defining a schema or model
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
      { $unwind: "$expenses" },
      {
        $project: {
          name: 1,
          mobile: 1,
          "farms.name": 1,
          "expenses.amount": 1,
          "expenses.name": 1,
          _id: 0,
        },
      },
      //   {
      //     $addFields: {
      //       totalExpenses: { $sum: "$expenses.amount" },
      //     },
      //   },
    ];

    const users = await usersCollection.aggregate(pipeline).toArray();
    console.log("Users data with farms and expenses:", users);
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
