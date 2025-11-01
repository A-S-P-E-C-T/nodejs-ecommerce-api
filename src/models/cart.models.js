import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],

        totalPrice: { type: Number, default: 0 },
    },
    { timestamps: true }
);

cartSchema.pre("save", function (next) {
    this.totalPrice = this.items.reduce(
        //Performing in the items array
        (acc, item) => acc + item.price * item.quantity,
        0
    );
    next();
});

export const Cart = mongoose.model("Cart", cartSchema);
