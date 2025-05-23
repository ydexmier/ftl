function builderReducer(state, action) {
    console.log(action)
    switch (action.type) {
        case 'ADD_QUANTITY': {
            return state.map(item => {
                if (item.id !== action.payload.id) return item;

                const newQuantity = Math.min((item.quantitySelected || 0) + 1, item.quantity);
                return { ...item, quantitySelected: newQuantity };
            });
        }

        case 'REMOVE_QUANTITY': {
            return state.map(item => {
                if (item.id !== action.payload.id) return item;

                const newQuantity = Math.max(item.quantitySelected - 1, 0);
                return { ...item, quantitySelected: newQuantity };
            });
        }

        default:
            return state;
    }
}

export default builderReducer;