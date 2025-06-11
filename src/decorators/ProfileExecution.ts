function ProfileExecution(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    const start = performance.now();
    try {
      return await originalMethod.apply(this, args);
    } finally {
      const elapsed = performance.now() - start;
      console.log(`Method ${propertyKey} took ${elapsed.toFixed(2)}ms`);
    }
  };
  
  return descriptor;
}

export default ProfileExecution;