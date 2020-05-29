// StudentManagement

const AWS = require('aws-sdk');
const smdb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    console.log('Event body: ', event.body);

    const rb = event.body;

    var endPoint = rb.Endpoint;
    var resultPromise;

    if (endPoint == "GetStudents") {
       resultPromise = getStudents();
    } else if (endPoint == "GetStudentById") {
       resultPromise = getStudentById(rb.StudentId); 
    } else if (endPoint == "PutStudent") {
        resultPromise = putStudent(rb.NewStudent); 
    } else if (endPoint == "DelStudent") {
        resultPromise = delStudent(rb.StudentId); 
    } else {
	    callback( null, errorResponse( "500", "endpoint is not available", context.awsRequestId));
	    return;
    }

    resultPromise.then((result) => {
	    console.log( 'Result: ', result.statusCode ); 
	    callback( null, result );
    }).catch((err) => {
        console.error(err);
        callback( null, errorResponse(err.statusCode, err.message, context.awsRequestId));
    });

};

function getStudents() {
  const params = {
      TableName: 'Students'
  };
  
  let studentsPromise = smdb.scan(params).promise();
  
  return studentsPromise.then((students) => {
    return students;
  });
}

function getStudentById(studentId) {
    const params = {
        TableName: 'Students',
        FilterExpression: 'StudentId = :uid',
        ExpressionAttributeValues: {":uid": studentId}
    };
    
    let studentsPromise = smdb.scan(params).promise();
    
    return studentsPromise.then((students) => {
        if (students.Count == 0)
            return errorResponse(404, "Student not found!");    
        
        return students.Items[0];
    });
}

function putStudent(newStudent) {
    const params = {
        TableName: 'Students',
        Item: {
            "StudentId":    newStudent.StudentId,
            "FirstName":    newStudent.FirstName,
	        "LastName":     newStudent.LastName,
	        "Email":        newStudent.Email,
	        "Active":       newStudent.Active
        }
    }
    
    let studentPromise = smdb.put(params).promise();
    
    return studentPromise.then(() => success("Student created!"));
}

function delStudent(studentId) {
    const params = {
        TableName: "Students",
        Key: {
            "StudentId": studentId
        }
    }
    
    let studentPromise = smdb.transactWrite({
        TransactItems: [{
            Delete: params
        }]
    }).promise();
    
    return studentPromise.then(() => success("Student deleted!"));
}

function success(result) {
    return {
	    statusCode: 200,
	    body: result,
    };
}

function errorResponse(status, errorMessage, awsRequestId) {
    return {
	    statusCode: status, 
	    body: {
	        Error: errorMessage,
	        Reference: awsRequestId,
	    }
    };
}