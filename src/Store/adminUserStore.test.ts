import { adminUserStore } from "./adminUserStore";
import { UserDetails, UserStatus } from "@madie/madie-models";
import { Subscription } from "rxjs";

describe("adminUserStore", () => {
  afterEach(() => {
    adminUserStore.updateUser(null);
  });

  it("exposes a null initialState", () => {
    expect(adminUserStore.initialState).toBeNull();
  });

  it("emits the current value synchronously on subscribe", () => {
    const mockSetUser = jest.fn();
    const subscription: Subscription = adminUserStore.subscribe(mockSetUser);
    expect(mockSetUser).toHaveBeenCalledTimes(1);
    expect(mockSetUser).toHaveBeenLastCalledWith(null);
    subscription.unsubscribe();
  });

  it("notifies subscribers when a user is set", () => {
    const mockSetUser = jest.fn();
    const subscription: Subscription = adminUserStore.subscribe(mockSetUser);

    const user: UserDetails = {
      id: "u1",
      harpId: "jane_doe",
      firstName: "jane",
      lastName: "doe",
      email: "jane.doe@example.com",
      status: UserStatus.ACTIVE,
      lastLoginAt: "2024-09-09T00:00:00.000Z",
    };
    adminUserStore.updateUser(user);

    expect(mockSetUser).toHaveBeenCalledWith(user);
    subscription.unsubscribe();
  });

  it("delivers the latest value to a subscriber that joins after an update", () => {
    const user: UserDetails = {
      id: "u2",
      harpId: "harp2",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      status: UserStatus.DEACTIVATED,
    };
    adminUserStore.updateUser(user);

    const mockSetUser = jest.fn();
    const subscription: Subscription = adminUserStore.subscribe(mockSetUser);

    expect(mockSetUser).toHaveBeenCalledTimes(1);
    expect(mockSetUser).toHaveBeenLastCalledWith(user);
    subscription.unsubscribe();
  });

  it("clears the user when updateUser is called with null", () => {
    const user: UserDetails = {
      id: "u3",
      firstName: "Temp",
      lastName: "User",
      status: UserStatus.ACTIVE,
    };
    adminUserStore.updateUser(user);

    const mockSetUser = jest.fn();
    const subscription: Subscription = adminUserStore.subscribe(mockSetUser);
    mockSetUser.mockClear();

    adminUserStore.updateUser(null);

    expect(mockSetUser).toHaveBeenCalledTimes(1);
    expect(mockSetUser).toHaveBeenLastCalledWith(null);
    subscription.unsubscribe();
  });

  it("broadcasts to multiple subscribers", () => {
    const firstSubscriber = jest.fn();
    const secondSubscriber = jest.fn();
    const firstSubscription = adminUserStore.subscribe(firstSubscriber);
    const secondSubscription = adminUserStore.subscribe(secondSubscriber);

    const user: UserDetails = {
      id: "u4",
      harpId: "harp4",
      firstName: "Multi",
      lastName: "Sub",
      email: "multi.sub@example.com",
      status: UserStatus.ERROR_SUSPENDED,
    };
    adminUserStore.updateUser(user);

    expect(firstSubscriber).toHaveBeenLastCalledWith(user);
    expect(secondSubscriber).toHaveBeenLastCalledWith(user);

    firstSubscription.unsubscribe();
    secondSubscription.unsubscribe();
  });

  it("stops emitting after unsubscribe", () => {
    const mockSetUser = jest.fn();
    const subscription: Subscription = adminUserStore.subscribe(mockSetUser);
    subscription.unsubscribe();
    mockSetUser.mockClear();

    adminUserStore.updateUser({
      id: "u5",
      firstName: "After",
      lastName: "Unsub",
    });

    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it("emits each consecutive update in order", () => {
    const mockSetUser = jest.fn();
    const subscription: Subscription = adminUserStore.subscribe(mockSetUser);
    mockSetUser.mockClear();

    const firstUser: UserDetails = {
      id: "u6",
      firstName: "First",
      lastName: "User",
      status: UserStatus.ACTIVE,
    };
    const secondUser: UserDetails = {
      id: "u7",
      firstName: "Second",
      lastName: "User",
      status: UserStatus.DEACTIVATED,
    };

    adminUserStore.updateUser(firstUser);
    adminUserStore.updateUser(secondUser);
    adminUserStore.updateUser(null);

    expect(mockSetUser).toHaveBeenCalledTimes(3);
    expect(mockSetUser.mock.calls[0][0]).toEqual(firstUser);
    expect(mockSetUser.mock.calls[1][0]).toEqual(secondUser);
    expect(mockSetUser.mock.calls[2][0]).toBeNull();

    subscription.unsubscribe();
  });
});
