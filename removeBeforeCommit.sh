rm -rf node_modules/ && \
echo "node_modules/ removed" && \

cd client && \
rm -rf build/ && \
echo "client/build/ removed" && \

rm -rf node_modules/ && \
echo "client/node_modules/ removed" && \


cd .. && \
echo "completed operation"